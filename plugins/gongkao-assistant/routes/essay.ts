/**
 * 公考助手 — 申论路由
 *
 * POST /essay/submit       提交申论作答
 * GET  /essay/submissions  申论答卷列表
 * GET  /essay/:id          答卷详情
 * POST /essay/:id/score    触发AI阅卷
 * GET  /essay/prompts      获取申论题目
 */

import type { GongkaoDB } from "../db.ts";

export default function register(app: any, ctx: any) {
  const getDb = (): GongkaoDB => {
    if ((ctx as any)._db) return (ctx as any)._db;
    throw new Error("Database not available");
  };

  // ── 提交申论作答 ────────────────────────────────────────────────────

  app.post("/essay/submit", async (c: any) => {
    const db = getDb();
    const body = await c.req.json();
    const { module_id, topic, requirements, essay } = body;

    if (!module_id || !topic || !essay) {
      return c.json({ error: "module_id, topic and essay required" }, 400);
    }

    const id = db.insertEssaySubmission({
      module_id,
      topic,
      requirements: requirements || "",
      user_essay: essay,
      word_count: essay.length,
    });

    // 自动触发 AI 阅卷
    const shenlunSubject = db.getSubjectByCode("shenlun");
    const mod = db.getModules(shenlunSubject?.id).find((m: any) => m.id === module_id);
    const moduleCode = mod?.code || "dawen";

    try {
      const scoringPrompt = buildEssayScoringPrompt(topic, requirements || "", essay, moduleCode);
      const result = await ctx.bus.request("model:sample-text", {
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

      db.updateEssayScore(id, score, feedback, details);

      return c.json({
        ok: true,
        id,
        score,
        feedback,
        details: JSON.parse(details),
      }, 201);
    } catch (err: any) {
      // 阅卷失败，仍保存提交
      return c.json({
        ok: true,
        id,
        score: null,
        feedback: null,
        scoringError: err.message,
      }, 201);
    }
  });

  // ── 申论答卷列表 ────────────────────────────────────────────────────

  app.get("/essay/submissions", (c: any) => {
    const db = getDb();
    const moduleId = Number(c.req.query("moduleId")) || undefined;
    const limit = Number(c.req.query("limit")) || 20;
    const offset = Number(c.req.query("offset")) || 0;

    const submissions = db.getEssaySubmissions({ moduleId, limit, offset });
    return c.json({ submissions, limit, offset });
  });

  // ── 答卷详情 ────────────────────────────────────────────────────────

  app.get("/essay/:id", (c: any) => {
    const db = getDb();
    const id = Number(c.req.param("id"));
    const submission = db.getEssaySubmissionById(id);
    if (!submission) {
      return c.json({ error: "not_found" }, 404);
    }
    return c.json({ submission });
  });

  // ── 手动触发AI阅卷 ──────────────────────────────────────────────────

  app.post("/essay/:id/score", async (c: any) => {
    const db = getDb();
    const id = Number(c.req.param("id"));
    const submission = db.getEssaySubmissionById(id);
    if (!submission) {
      return c.json({ error: "not_found" }, 404);
    }

    const shenlunSubject = db.getSubjectByCode("shenlun");
    const mod = db.getModules(shenlunSubject?.id).find((m: any) => m.id === submission.module_id);
    const moduleCode = mod?.code || "dawen";

    const scoringPrompt = buildEssayScoringPrompt(
      submission.topic,
      submission.requirements,
      submission.user_essay,
      moduleCode,
    );

    const result = await ctx.bus.request("model:sample-text", {
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

    db.updateEssayScore(id, score, feedback, details);

    return c.json({
      ok: true,
      score,
      feedback,
      details: JSON.parse(details),
    });
  });

  // ── 申论题目列表（从题库中获取 essay_prompt 类型） ──────────────────

  app.get("/essay/prompts", (c: any) => {
    const db = getDb();
    const shenlunSubject = db.getSubjectByCode("shenlun");
    if (!shenlunSubject) {
      return c.json({ prompts: [] });
    }

    const moduleId = Number(c.req.query("moduleId")) || undefined;
    const prompts = db.getQuestions({
      subjectId: shenlunSubject.id,
      moduleId,
      type: "essay_prompt",
      limit: 20,
    });

    return c.json({
      prompts: prompts.map(p => ({
        id: p.id,
        moduleId: p.module_id,
        content: p.content,
        requirements: p.explanation,
        source: p.source,
        year: p.year,
      })),
    });
  });
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

  const user = `## 题目\n${topic}\n\n## 作答要求\n${requirements || "无特殊要求"}\n\n## 考生作答\n${essay}\n\n请评分。`;

  return { system, user };
}
