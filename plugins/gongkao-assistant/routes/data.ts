/**
 * 公考助手 — 数据导入路由
 *
 * POST /data/import-seed    导入种子题库
 * POST /data/import         导入自定义题库（JSON）
 * GET  /data/status         数据状态
 */

import type { GongkaoDB } from "../db.ts";
import fs from "fs";
import path from "path";

export default function register(app: any, ctx: any) {
  const getDb = (): GongkaoDB => {
    if ((ctx as any)._db) return (ctx as any)._db;
    throw new Error("Database not available");
  };

  // ── 导入种子题库 ────────────────────────────────────────────────────

  app.post("/data/import-seed", async (c: any) => {
    const db = getDb();

    // 检查是否已有数据
    const existingCount = db.getQuestionCount();
    if (existingCount > 0) {
      return c.json({ error: "already_has_data", message: "题库已有数据，如需重新导入请先清空", count: existingCount }, 409);
    }

    // 读取种子数据
    const seedPath = path.join(ctx.pluginDir, "data", "seed-questions.json");
    if (!fs.existsSync(seedPath)) {
      return c.json({ error: "seed_file_not_found" }, 404);
    }

    try {
      const raw = fs.readFileSync(seedPath, "utf-8");
      const questions = JSON.parse(raw);

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
    } catch (err: any) {
      return c.json({ error: "import_failed", message: err.message }, 500);
    }
  });

  // ── 导入自定义题库 ──────────────────────────────────────────────────

  app.post("/data/import", async (c: any) => {
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

  // ── 数据状态 ────────────────────────────────────────────────────────

  app.get("/data/status", (c: any) => {
    const db = getDb();
    const subjects = db.getSubjects();

    const status: any = {};
    for (const s of subjects) {
      const questionCount = db.getQuestionCount({ subjectId: s.id });
      const stats = db.getPracticeStats({ subjectId: s.id });
      status[s.code] = {
        name: s.name,
        questionCount,
        practicedCount: stats.total,
        accuracy: stats.accuracy,
      };
    }

    return c.json({ status });
  });
}
