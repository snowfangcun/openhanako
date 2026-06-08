/**
 * 公考助手 — 插件入口
 *
 * 生命周期：onload 初始化数据库，onunload 关闭连接
 * 贡献：routes（API）、tools（Agent 工具）、skills（知识注入）
 */

import { GongkaoDB } from "./db.ts";

let db: GongkaoDB | null = null;

export function getDB(): GongkaoDB {
  if (!db) throw new Error("GongkaoDB not initialized");
  return db;
}

export default class GongkaoAssistantPlugin {
  declare ctx: any;
  declare register: any;

  async onload() {
    const { ctx, register } = this;
    ctx.log.info("公考助手插件加载中...");

    // 初始化数据库
    db = new GongkaoDB(ctx.dataDir);
    db.init();
    // 将 DB 挂载到 ctx，供 routes 使用
    (ctx as any)._db = db;
    register(() => {
      (ctx as any)._db = null;
      db?.close();
      db = null;
    });

    // 注册动态工具（Agent 可调用）
    const disposeGradeEssay = ctx.registerTool?.({
      name: "grade_essay",
      description: "对申论作答进行AI阅卷评分，返回分数和详细反馈",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "申论题目" },
          requirements: { type: "string", description: "作答要求" },
          essay: { type: "string", description: "用户申论作答文本" },
          module: { type: "string", description: "题型模块：guina/tichu/zonghe/guanche/dawen", enum: ["guina", "tichu", "zonghe", "guanche", "dawen"] },
        },
        required: ["topic", "essay", "module"],
      },
      async execute(input: any, toolCtx: any) {
        const { topic, requirements = "", essay, module: moduleCode } = input;
        const gkDb = getDB();
        const shenlunSubject = gkDb.getSubjectByCode("shenlun");
        const mod = shenlunSubject ? gkDb.getModuleByCode(shenlunSubject.id, moduleCode) : null;

        // 调用 LLM 阅卷
        const scoringPrompt = buildEssayScoringPrompt(topic, requirements, essay, moduleCode);
        const result = await toolCtx.bus.request("model:sample-text", {
          systemPrompt: scoringPrompt.system,
          messages: [{ role: "user", content: scoringPrompt.user }],
          temperature: 0.3,
          maxTokens: 3000,
        });

        let score = 0;
        let feedback = "";
        let details = "{}";
        try {
          const parsed = JSON.parse((result as any).text || "{}");
          score = parsed.score ?? 0;
          feedback = parsed.feedback ?? "";
          details = JSON.stringify(parsed.details ?? {});
        } catch {
          feedback = (result as any).text || "评分解析失败";
        }

        // 存入数据库
        if (mod) {
          const submissionId = gkDb.insertEssaySubmission({
            module_id: mod.id,
            topic,
            requirements,
            user_essay: essay,
            word_count: essay.length,
          });
          gkDb.updateEssayScore(submissionId, score, feedback, details);
        }

        return {
          content: [{ type: "text", text: `## 申论阅卷结果\n\n**得分：${score}/100**\n\n${feedback}` }],
        };
      },
    });
    if (disposeGradeEssay) register(disposeGradeEssay);

    const disposeAnalyzeMistake = ctx.registerTool?.({
      name: "analyze_mistake",
      description: "对错题进行AI解析，分析错误原因并给出学习建议",
      parameters: {
        type: "object",
        properties: {
          questionId: { type: "number", description: "题目ID" },
        },
        required: ["questionId"],
      },
      async execute(input: any, toolCtx: any) {
        const gkDb = getDB();
        const question = gkDb.getQuestionById(input.questionId);
        if (!question) {
          return { content: [{ type: "text", text: "未找到该题目" }] };
        }

        // 查找该题最近的错误记录
        const wrongEntry = gkDb.getWrongQuestions({ subjectId: question.subject_id, mastered: 0, limit: 1 })
          .find((w: any) => w.question_id === question.id);

        const prompt = `你是一位经验丰富的公考辅导老师。请对以下错题进行详细解析：

## 题目
${question.content}

${question.options ? `## 选项\n${question.options}` : ""}

## 正确答案
${question.answer}

## 原有解析
${question.explanation || "无"}

${wrongEntry ? `## 用户答案（错误）\n请分析用户可能的错误思路` : ""}

请从以下角度分析：
1. **错误原因**：分析可能的错误思路
2. **知识点**：本题涉及的核心知识点
3. **解题思路**：正确的解题步骤
4. **举一反三**：同类题目的解题技巧
5. **学习建议**：针对该知识点的复习建议`;

        const result = await toolCtx.bus.request("model:sample-text", {
          systemPrompt: "你是一位专业的公务员考试辅导老师，擅长分析错题并给出针对性建议。请用中文回答，格式清晰。",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.5,
          maxTokens: 2000,
        });

        // 标记错题已复习
        if (wrongEntry) {
          gkDb.markWrongQuestionReviewed(wrongEntry.id, false);
        }

        return {
          content: [{ type: "text", text: (result as any).text || "解析生成失败" }],
        };
      },
    });
    if (disposeAnalyzeMistake) register(disposeAnalyzeMistake);

    const disposeGeneratePaper = ctx.registerTool?.({
      name: "generate_paper",
      description: "根据用户需求智能组卷，生成练习试卷",
      parameters: {
        type: "object",
        properties: {
          subject: { type: "string", description: "科目：xingce/shenlun", enum: ["xingce", "shenlun"] },
          modules: {
            type: "array",
            items: { type: "object", properties: { code: { type: "string" }, count: { type: "number" } }, required: ["code", "count"] },
            description: "各模块抽题数量",
          },
          difficulty: { type: "string", description: "难度偏好：easy/medium/hard", enum: ["easy", "medium", "hard"] },
          focusWeakAreas: { type: "boolean", description: "是否侧重薄弱模块" },
        },
        required: ["subject"],
      },
      async execute(input: any, toolCtx: any) {
        const gkDb = getDB();
        const subject = gkDb.getSubjectByCode(input.subject);
        if (!subject) {
          return { content: [{ type: "text", text: "未找到该科目" }] };
        }

        let modules = input.modules;
        // 如果侧重薄弱模块，根据答题正确率调整
        if (input.focusWeakAreas && !modules) {
          const moduleStats = gkDb.getModuleStats(subject.id);
          modules = moduleStats
            .filter((m: any) => m.practicedCount > 0 && m.accuracy < 70)
            .map((m: any) => ({ code: m.moduleName, count: 10 }))
            .slice(0, 3);
          if (modules.length === 0) {
            const allModules = gkDb.getModules(subject.id);
            const countPerModule = Math.ceil((input.count ?? 40) / allModules.length);
            modules = allModules.map((m: any) => ({ code: m.code, count: countPerModule }));
          }
        }

        // 默认均匀分配
        if (!modules || modules.length === 0) {
          const allModules = gkDb.getModules(subject.id);
          const countPerModule = Math.ceil((input.count ?? 40) / allModules.length);
          modules = allModules.map((m: any) => ({ code: m.code, count: countPerModule }));
        }

        const allQuestions: any[] = [];
        const usedIds: number[] = [];

        for (const modSpec of modules) {
          const mod = gkDb.getModuleByCode(subject.id, modSpec.code);
          if (!mod) continue;
          const questions = gkDb.pickRandomQuestions({
            subjectId: subject.id,
            moduleId: mod.id,
            difficulty: input.difficulty,
            count: modSpec.count,
            excludeIds: usedIds,
          });
          for (const q of questions) {
            usedIds.push(q.id);
            allQuestions.push(q);
          }
        }

        if (allQuestions.length === 0) {
          return { content: [{ type: "text", text: "题库中暂无符合条件的题目，请先导入题库数据" }] };
        }

        // 保存生成的试卷
        const paperId = gkDb.insertGeneratedPaper({
          template_id: null,
          name: `${subject.name}智能组卷 ${new Date().toLocaleDateString("zh-CN")}`,
          subject_id: subject.id,
          question_ids: JSON.stringify(allQuestions.map((q: any) => q.id)),
          total_score: allQuestions.length,
          time_limit_min: Math.ceil(allQuestions.length * 1.5),
        });

        const moduleSummary = modules.map((m: any) => `${m.code}: ${m.count}题`).join(", ");

        return {
          content: [{
            type: "text",
            text: `## 智能组卷完成\n\n**试卷ID**: ${paperId}\n**科目**: ${subject.name}\n**题目数**: ${allQuestions.length}\n**模块分布**: ${moduleSummary}\n**建议用时**: ${Math.ceil(allQuestions.length * 1.5)}分钟\n\n可以开始答题了！`,
          }],
        };
      },
    });
    if (disposeGeneratePaper) register(disposeGeneratePaper);

    ctx.log.info("公考助手插件加载完成");
  }

  async onunload() {
    this.ctx.log.info("公考助手插件卸载");
    db?.close();
    db = null;
  }
}

// ── 辅助函数 ──────────────────────────────────────────────────────────

function buildEssayScoringPrompt(
  topic: string,
  requirements: string,
  essay: string,
  moduleCode: string,
): { system: string; user: string } {
  const moduleNames: Record<string, string> = {
    guina: "归纳概括",
    tichu: "提出对策",
    zonghe: "综合分析",
    guanche: "贯彻执行",
    dawen: "大作文",
  };

  const moduleName = moduleNames[moduleCode] || "申论";

  const system = `你是一位资深的公务员考试申论阅卷专家，专长于${moduleName}题型评分。
请严格按照公务员考试评分标准进行评分，返回严格的JSON格式：
{
  "score": <0-100的分数>,
  "feedback": "<总体评价>",
  "details": {
    "content": { "score": <内容分>, "max": <满分>, "comment": "<评语>" },
    "structure": { "score": <结构分>, "max": <满分>, "comment": "<评语>" },
    "language": { "score": <语言分>, "max": <满分>, "comment": "<评语>" },
    "logic": { "score": <逻辑分>, "max": <满分>, "comment": "<评语>" }
  }
}

评分维度说明：
- 内容(content)：是否切题、要点是否全面（权重40%）
- 结构(structure)：层次是否清晰、段落是否合理（权重20%）
- 语言(language)：表达是否规范、用词是否准确（权重20%）
- 逻辑(logic)：论证是否有力、逻辑是否严密（权重20%）

只返回JSON，不要附加其他文本。`;

  const user = `## 题目
${topic}

## 作答要求
${requirements || "无特殊要求"}

## 考生作答
${essay}

请评分。`;

  return { system, user };
}
