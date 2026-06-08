/**
 * 公考助手 — 题库管理路由
 *
 * GET    /questions          题目列表（支持筛选）
 * GET    /questions/:id      题目详情
 * POST   /questions          新增题目
 * POST   /questions/batch    批量导入
 * DELETE /questions/:id      删除题目
 * GET    /questions/count    题目统计
 * POST   /papers/generate    智能组卷
 * GET    /papers             试卷列表
 * GET    /papers/:id         试卷详情
 */

import type { GongkaoDB, Question, Difficulty, QuestionType } from "../db.ts";

export default function register(app: any, ctx: any) {
  const getDb = (): GongkaoDB => {
    // 通过 pluginCtx 获取 DB 实例
    const mod = ctx as any;
    if (mod._db) return mod._db;
    // 延迟引用：从 index.ts 的 getDB() 获取
    throw new Error("Database not available");
  };

  // ── 科目 & 模块 ────────────────────────────────────────────────────

  app.get("/subjects", (c: any) => {
    const db = getDb();
    const subjects = db.getSubjects();
    const result = subjects.map((s: any) => ({
      ...s,
      modules: db.getModules(s.id),
    }));
    return c.json({ subjects: result });
  });

  app.get("/modules", (c: any) => {
    const db = getDb();
    const subjectId = Number(c.req.query("subjectId")) || undefined;
    const modules = db.getModules(subjectId);
    return c.json({ modules });
  });

  // ── 题目列表 ────────────────────────────────────────────────────────

  app.get("/questions", (c: any) => {
    const db = getDb();
    const filter: any = {};
    const subjectId = Number(c.req.query("subjectId")) || undefined;
    const moduleId = Number(c.req.query("moduleId")) || undefined;
    const type = c.req.query("type") as QuestionType | undefined;
    const difficulty = c.req.query("difficulty") as Difficulty | undefined;
    const tags = c.req.query("tags")?.split(",").filter(Boolean) || undefined;
    const limit = Number(c.req.query("limit")) || 50;
    const offset = Number(c.req.query("offset")) || 0;

    if (subjectId) filter.subjectId = subjectId;
    if (moduleId) filter.moduleId = moduleId;
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;
    if (tags) filter.tags = tags;
    filter.limit = limit;
    filter.offset = offset;

    const questions = db.getQuestions(filter);
    return c.json({
      questions,
      limit,
      offset,
    });
  });

  // ── 题目统计（必须在 /questions/:id 之前注册） ──────────────────────

  app.get("/questions/count", (c: any) => {
    const db = getDb();
    const subjectId = Number(c.req.query("subjectId")) || undefined;
    const moduleId = Number(c.req.query("moduleId")) || undefined;
    const difficulty = c.req.query("difficulty") as Difficulty | undefined;

    const total = db.getQuestionCount({ subjectId, moduleId, difficulty });
    return c.json({ total });
  });

  // ── 题目详情 ────────────────────────────────────────────────────────

  app.get("/questions/:id", (c: any) => {
    const db = getDb();
    const id = Number(c.req.param("id"));
    const question = db.getQuestionById(id);
    if (!question) {
      return c.json({ error: "not_found" }, 404);
    }
    return c.json({ question });
  });

  // ── 新增题目 ────────────────────────────────────────────────────────

  app.post("/questions", async (c: any) => {
    const db = getDb();
    const body = await c.req.json();
    const { subject_id, module_id, type, difficulty, content, options, answer, explanation, tags, source, year } = body;

    if (!subject_id || !module_id || !type || !content || !answer) {
      return c.json({ error: "missing_required_fields" }, 400);
    }

    const id = db.insertQuestion({
      subject_id,
      module_id,
      type,
      difficulty: difficulty || "medium",
      content,
      options: options ? JSON.stringify(options) : null,
      answer,
      explanation: explanation || "",
      tags: JSON.stringify(tags || []),
      source: source || "",
      year: year || null,
    });

    return c.json({ ok: true, id }, 201);
  });

  // ── 批量导入 ────────────────────────────────────────────────────────

  app.post("/questions/batch", async (c: any) => {
    const db = getDb();
    const body = await c.req.json();
    const { questions } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return c.json({ error: "questions array required" }, 400);
    }

    const mapped = questions.map((q: any) => ({
      subject_id: q.subject_id,
      module_id: q.module_id,
      type: q.type,
      difficulty: q.difficulty || "medium",
      content: q.content,
      options: q.options ? JSON.stringify(q.options) : null,
      answer: q.answer,
      explanation: q.explanation || "",
      tags: JSON.stringify(q.tags || []),
      source: q.source || "",
      year: q.year || null,
    }));

    const count = db.insertQuestionsBatch(mapped);
    return c.json({ ok: true, imported: count });
  });

  // ── 删除题目 ────────────────────────────────────────────────────────

  app.delete("/questions/:id", (c: any) => {
    const db = getDb();
    const id = Number(c.req.param("id"));
    const ok = db.deleteQuestion(id);
    if (!ok) {
      return c.json({ error: "not_found" }, 404);
    }
    return c.json({ ok: true });
  });

  // ── 智能组卷 ────────────────────────────────────────────────────────

  app.post("/papers/generate", async (c: any) => {
    const db = getDb();
    const body = await c.req.json();
    const { subject, modules, difficulty, name } = body;

    const subjectCode = subject || "xingce";
    const subjectObj = db.getSubjectByCode(subjectCode);
    if (!subjectObj) {
      return c.json({ error: "subject_not_found" }, 400);
    }

    // 如果指定了模块分布，按分布抽题
    let allQuestions: Question[] = [];
    const usedIds: number[] = [];

    if (Array.isArray(modules) && modules.length > 0) {
      for (const modSpec of modules) {
        const mod = db.getModuleByCode(subjectObj.id, modSpec.code);
        if (!mod) continue;
        const questions = db.pickRandomQuestions({
          subjectId: subjectObj.id,
          moduleId: mod.id,
          difficulty: modSpec.difficulty || difficulty,
          count: modSpec.count,
          excludeIds: usedIds,
        });
        for (const q of questions) {
          usedIds.push(q.id);
          allQuestions.push(q);
        }
      }
    } else {
      // 均匀分配
      const allModules = db.getModules(subjectObj.id);
      const total = body.count || 40;
      const perModule = Math.ceil(total / allModules.length);
      for (const mod of allModules) {
        const questions = db.pickRandomQuestions({
          subjectId: subjectObj.id,
          moduleId: mod.id,
          difficulty,
          count: perModule,
          excludeIds: usedIds,
        });
        for (const q of questions) {
          usedIds.push(q.id);
          allQuestions.push(q);
        }
      }
    }

    if (allQuestions.length === 0) {
      return c.json({ error: "no_questions_available" }, 400);
    }

    // 保存试卷
    const paperId = db.insertGeneratedPaper({
      template_id: body.templateId || null,
      name: name || `${subjectObj.name}练习 ${new Date().toLocaleDateString("zh-CN")}`,
      subject_id: subjectObj.id,
      question_ids: JSON.stringify(allQuestions.map(q => q.id)),
      total_score: allQuestions.length,
      time_limit_min: Math.ceil(allQuestions.length * 1.5),
    });

    return c.json({
      ok: true,
      paper: {
        id: paperId,
        name: name || `${subjectObj.name}练习`,
        questionCount: allQuestions.length,
        timeLimitMin: Math.ceil(allQuestions.length * 1.5),
        questions: allQuestions.map(q => ({
          id: q.id,
          type: q.type,
          difficulty: q.difficulty,
          content: q.content,
          options: q.options ? JSON.parse(q.options) : null,
          // 不返回 answer，防止刷题时看到答案
        })),
      },
    }, 201);
  });

  // ── 试卷列表 ────────────────────────────────────────────────────────

  app.get("/papers", (c: any) => {
    const db = getDb();
    const subjectId = Number(c.req.query("subjectId")) || undefined;
    const limit = Number(c.req.query("limit")) || 20;
    const papers = db.getGeneratedPapers(subjectId, limit);
    return c.json({ papers });
  });

  // ── 试卷详情 ────────────────────────────────────────────────────────

  app.get("/papers/:id", (c: any) => {
    const db = getDb();
    const id = Number(c.req.param("id"));
    const paper = db.getGeneratedPaperById(id);
    if (!paper) {
      return c.json({ error: "not_found" }, 404);
    }

    const questionIds: number[] = JSON.parse(paper.question_ids);
    const questions = questionIds
      .map(qid => db.getQuestionById(qid))
      .filter(Boolean)
      .map(q => ({
        id: q!.id,
        type: q!.type,
        difficulty: q!.difficulty,
        content: q!.content,
        options: q!.options ? JSON.parse(q!.options) : null,
      }));

    return c.json({ paper, questions });
  });

  // ── 组卷模板 ────────────────────────────────────────────────────────

  app.get("/templates", (c: any) => {
    const db = getDb();
    const subjectId = Number(c.req.query("subjectId")) || undefined;
    const templates = db.getPaperTemplates(subjectId);
    return c.json({ templates });
  });

  app.post("/templates", async (c: any) => {
    const db = getDb();
    const body = await c.req.json();
    const { name, subject_id, rules, total_score, time_limit_min } = body;
    if (!name || !subject_id) {
      return c.json({ error: "name and subject_id required" }, 400);
    }
    const id = db.insertPaperTemplate({
      name,
      subject_id,
      rules: JSON.stringify(rules || []),
      total_score: total_score || 100,
      time_limit_min: time_limit_min || 120,
    });
    return c.json({ ok: true, id }, 201);
  });
}
