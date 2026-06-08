/**
 * 公考助手 — 学习统计路由
 *
 * GET /stats/overview       总览统计
 * GET /stats/by-module      模块维度统计
 * GET /stats/daily          每日趋势
 * GET /stats/weak-points    薄弱环节分析
 */

import type { GongkaoDB } from "../db.ts";

export default function register(app: any, ctx: any) {
  const getDb = (): GongkaoDB => {
    if ((ctx as any)._db) return (ctx as any)._db;
    throw new Error("Database not available");
  };

  // ── 总览统计 ────────────────────────────────────────────────────────

  app.get("/stats/overview", (c: any) => {
    const db = getDb();

    const xingceSubject = db.getSubjectByCode("xingce");
    const shenlunSubject = db.getSubjectByCode("shenlun");

    const xingceStats = db.getPracticeStats({ subjectId: xingceSubject?.id });
    const shenlunStats = db.getPracticeStats({ subjectId: shenlunSubject?.id });

    const xingceQuestionCount = db.getQuestionCount({ subjectId: xingceSubject?.id });
    const shenlunQuestionCount = db.getQuestionCount({ subjectId: shenlunSubject?.id });

    const wrongCount = db.getWrongQuestionCount({ mastered: 0 });

    // 最近7天统计
    const recentStats = db.getPracticeStats({ since: new Date(Date.now() - 7 * 86400000).toISOString() });

    return c.json({
      xingce: {
        ...xingceStats,
        questionCount: xingceQuestionCount,
      },
      shenlun: {
        ...shenlunStats,
        questionCount: shenlunQuestionCount,
      },
      total: {
        questions: xingceQuestionCount + shenlunQuestionCount,
        practiced: xingceStats.total + shenlunStats.total,
        wrongCount,
      },
      recent7Days: recentStats,
    });
  });

  // ── 模块维度统计 ────────────────────────────────────────────────────

  app.get("/stats/by-module", (c: any) => {
    const db = getDb();
    const subjectId = Number(c.req.query("subjectId"));
    if (!subjectId) {
      return c.json({ error: "subjectId required" }, 400);
    }

    const moduleStats = db.getModuleStats(subjectId);
    return c.json({ moduleStats });
  });

  // ── 每日趋势 ────────────────────────────────────────────────────────

  app.get("/stats/daily", (c: any) => {
    const db = getDb();
    const days = Number(c.req.query("days")) || 30;
    const dailyStats = db.getDailyStats(days);
    return c.json({ dailyStats });
  });

  // ── 薄弱环节分析 ────────────────────────────────────────────────────

  app.get("/stats/weak-points", (c: any) => {
    const db = getDb();
    const subjectId = Number(c.req.query("subjectId")) || undefined;

    // 获取所有有练习记录的模块统计
    const subjects = subjectId ? [db.getSubjects().find(s => s.id === subjectId)].filter(Boolean) : db.getSubjects();

    const weakPoints: any[] = [];
    for (const subject of subjects) {
      if (!subject) continue;
      const moduleStats = db.getModuleStats(subject.id);
      for (const ms of moduleStats) {
        if (ms.practicedCount > 0 && ms.accuracy < 70) {
          weakPoints.push({
            subjectId: subject.id,
            subjectName: subject.name,
            ...ms,
          });
        }
      }
    }

    // 按正确率排序（最低在前）
    weakPoints.sort((a, b) => a.accuracy - b.accuracy);

    return c.json({ weakPoints });
  });
}
