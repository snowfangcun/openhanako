/**
 * 公考助手 — 刷题练习路由
 *
 * POST /practice/submit     提交单题答案
 * POST /practice/batch      批量提交答案
 * GET  /practice/stats      答题统计
 * GET  /wrong-questions     错题列表
 * POST /wrong-questions/:id/review  标记错题已复习
 * GET  /wrong-questions/count       错题数量
 */

import type { GongkaoDB } from "../db.ts";

export default function register(app: any, ctx: any) {
  const getDb = (): GongkaoDB => {
    if ((ctx as any)._db) return (ctx as any)._db;
    throw new Error("Database not available");
  };

  // ── 提交单题答案 ────────────────────────────────────────────────────

  app.post("/practice/submit", async (c: any) => {
    const db = getDb();
    const body = await c.req.json();
    const { question_id, user_answer, time_spent_ms } = body;

    if (!question_id || user_answer === undefined) {
      return c.json({ error: "question_id and user_answer required" }, 400);
    }

    // 获取正确答案
    const question = db.getQuestionById(question_id);
    if (!question) {
      return c.json({ error: "question_not_found" }, 404);
    }

    const isCorrect = checkAnswer(question, user_answer);

    // 保存答题记录
    const recordId = db.insertPracticeRecord({
      question_id,
      user_answer: String(user_answer),
      is_correct: isCorrect ? 1 : 0,
      time_spent_ms: time_spent_ms || 0,
    });

    // 如果答错，加入错题本
    if (!isCorrect) {
      db.addWrongQuestion(question_id, recordId);
    }

    return c.json({
      ok: true,
      recordId,
      isCorrect,
      correctAnswer: question.answer,
      explanation: question.explanation,
    });
  });

  // ── 批量提交答案 ────────────────────────────────────────────────────

  app.post("/practice/batch", async (c: any) => {
    const db = getDb();
    const body = await c.req.json();
    const { answers } = body; // [{ question_id, user_answer, time_spent_ms }]

    if (!Array.isArray(answers) || answers.length === 0) {
      return c.json({ error: "answers array required" }, 400);
    }

    const results: any[] = [];
    const records: any[] = [];
    const wrongEntries: any[] = [];

    for (const ans of answers) {
      const question = db.getQuestionById(ans.question_id);
      if (!question) continue;

      const isCorrect = checkAnswer(question, ans.user_answer);
      records.push({
        question_id: ans.question_id,
        user_answer: String(ans.user_answer),
        is_correct: isCorrect ? 1 : 0,
        time_spent_ms: ans.time_spent_ms || 0,
      });
      results.push({
        question_id: ans.question_id,
        isCorrect,
        correctAnswer: question.answer,
        explanation: question.explanation,
      });
      if (!isCorrect) {
        wrongEntries.push({ question_id: ans.question_id });
      }
    }

    // 批量插入答题记录
    db.insertPracticeRecordsBatch(records);

    // 处理错题
    for (const w of wrongEntries) {
      const recentRecord = db.raw.prepare(
        "SELECT id FROM practice_records WHERE question_id = ? ORDER BY created_at DESC LIMIT 1"
      ).get(w.question_id) as any;
      if (recentRecord) {
        db.addWrongQuestion(w.question_id, recentRecord.id);
      }
    }

    const correctCount = results.filter(r => r.isCorrect).length;
    return c.json({
      ok: true,
      total: results.length,
      correct: correctCount,
      accuracy: results.length > 0 ? Math.round(correctCount / results.length * 10000) / 100 : 0,
      results,
    });
  });

  // ── 答题统计 ────────────────────────────────────────────────────────

  app.get("/practice/stats", (c: any) => {
    const db = getDb();
    const subjectId = Number(c.req.query("subjectId")) || undefined;
    const moduleId = Number(c.req.query("moduleId")) || undefined;
    const since = c.req.query("since") as string | undefined;

    const stats = db.getPracticeStats({ subjectId, moduleId, since });
    return c.json({ stats });
  });

  // ── 模块统计 ────────────────────────────────────────────────────────

  app.get("/practice/module-stats", (c: any) => {
    const db = getDb();
    const subjectId = Number(c.req.query("subjectId"));
    if (!subjectId) {
      return c.json({ error: "subjectId required" }, 400);
    }
    const moduleStats = db.getModuleStats(subjectId);
    return c.json({ moduleStats });
  });

  // ── 每日统计 ────────────────────────────────────────────────────────

  app.get("/practice/daily-stats", (c: any) => {
    const db = getDb();
    const days = Number(c.req.query("days")) || 30;
    const dailyStats = db.getDailyStats(days);
    return c.json({ dailyStats });
  });

  // ── 错题列表 ────────────────────────────────────────────────────────

  app.get("/wrong-questions", (c: any) => {
    const db = getDb();
    const subjectId = Number(c.req.query("subjectId")) || undefined;
    const moduleId = Number(c.req.query("moduleId")) || undefined;
    const mastered = c.req.query("mastered") !== undefined ? Number(c.req.query("mastered")) : 0;
    const limit = Number(c.req.query("limit")) || 50;
    const offset = Number(c.req.query("offset")) || 0;

    const wrongQuestions = db.getWrongQuestions({ subjectId, moduleId, mastered, limit, offset });
    return c.json({ wrongQuestions, limit, offset });
  });

  // ── 错题数量 ────────────────────────────────────────────────────────

  app.get("/wrong-questions/count", (c: any) => {
    const db = getDb();
    const subjectId = Number(c.req.query("subjectId")) || undefined;
    const mastered = c.req.query("mastered") !== undefined ? Number(c.req.query("mastered")) : 0;
    const count = db.getWrongQuestionCount({ subjectId, mastered });
    return c.json({ count });
  });

  // ── 标记错题已复习 ──────────────────────────────────────────────────

  app.post("/wrong-questions/:id/review", async (c: any) => {
    const db = getDb();
    const id = Number(c.req.param("id"));
    const body = await c.req.json().catch(() => ({}));
    const mastered = !!body.mastered;
    db.markWrongQuestionReviewed(id, mastered);
    return c.json({ ok: true });
  });
}

// ── 辅助函数 ──────────────────────────────────────────────────────────

function checkAnswer(question: any, userAnswer: string | string[]): boolean {
  const correct = question.answer.trim();
  const user = Array.isArray(userAnswer) ? userAnswer.sort().join(",") : String(userAnswer).trim();
  // 支持多选题：答案格式 "A,B,C" 或 "ABC"
  const normalizedCorrect = correct.replace(/\s*,\s*/g, ",").split(",").sort().join(",");
  const normalizedUser = user.replace(/\s*,\s*/g, ",").split(",").sort().join(",");
  return normalizedCorrect === normalizedUser;
}
