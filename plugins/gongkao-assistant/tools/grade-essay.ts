/**
 * 公考助手 — AI申论阅卷工具
 *
 * Agent 可调用此工具对用户申论作答进行AI评分
 */

export const name = "grade_essay";
export const description = "对申论作答进行AI阅卷评分，返回分数和详细反馈。支持归纳概括、提出对策、综合分析、贯彻执行、大作文等题型。";

export const parameters = {
  type: "object",
  properties: {
    topic: {
      type: "string",
      description: "申论题目",
    },
    requirements: {
      type: "string",
      description: "作答要求",
    },
    essay: {
      type: "string",
      description: "用户的申论作答文本",
    },
    module: {
      type: "string",
      description: "题型模块代码",
      enum: ["guina", "tichu", "zonghe", "guanche", "dawen"],
    },
  },
  required: ["topic", "essay", "module"],
};

export async function execute(input: any, toolCtx: any) {
  const { topic, requirements = "", essay, module: moduleCode } = input;

  const moduleNames: Record<string, string> = {
    guina: "归纳概括",
    tichu: "提出对策",
    zonghe: "综合分析",
    guanche: "贯彻执行",
    dawen: "大作文",
  };

  const moduleName = moduleNames[moduleCode] || "申论";

  const systemPrompt = `你是一位资深的公务员考试申论阅卷专家，专长于${moduleName}题型评分。
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

  const userPrompt = `## 题目\n${topic}\n\n## 作答要求\n${requirements || "无特殊要求"}\n\n## 考生作答\n${essay}\n\n请评分。`;

  // 调用 LLM
  const result = await toolCtx.bus.request("model:sample-text", {
    systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    temperature: 0.3,
    maxTokens: 3000,
  });

  let score = 0;
  let feedback = "";
  let details: any = {};
  try {
    const parsed = JSON.parse((result as any).text || "{}");
    score = parsed.score ?? 0;
    feedback = parsed.feedback ?? "";
    details = parsed.details ?? {};
  } catch {
    feedback = (result as any).text || "评分解析失败";
  }

  // 存入数据库
  try {
    const { getDB } = await import("../index.ts");
    const db = getDB();
    const shenlunSubject = db.getSubjectByCode("shenlun");
    const mod = shenlunSubject ? db.getModuleByCode(shenlunSubject.id, moduleCode) : null;

    if (mod) {
      const submissionId = db.insertEssaySubmission({
        module_id: mod.id,
        topic,
        requirements,
        user_essay: essay,
        word_count: essay.length,
      });
      db.updateEssayScore(submissionId, score, feedback, JSON.stringify(details));
    }
  } catch {
    // 数据库写入失败不影响返回结果
  }

  let resultText = `## 申论阅卷结果\n\n**得分：${score}/100**\n\n${feedback}`;

  if (details && typeof details === "object") {
    resultText += "\n\n### 分项评分\n";
    for (const [key, val] of Object.entries(details)) {
      const v = val as any;
      if (v.score !== undefined) {
        const labels: Record<string, string> = {
          content: "内容", structure: "结构", language: "语言", logic: "逻辑",
        };
        resultText += `- **${labels[key] || key}**：${v.score}/${v.max} — ${v.comment || ""}\n`;
      }
    }
  }

  return resultText;
}
