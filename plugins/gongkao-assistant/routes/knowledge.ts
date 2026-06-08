/**
 * 公考助手 — 知识库路由
 *
 * GET    /knowledge          知识条目列表
 * POST   /knowledge          新增知识条目
 * GET    /knowledge/:id      知识条目详情
 * DELETE /knowledge/:id      删除知识条目
 * GET    /knowledge/categories 获取分类列表
 */

import type { GongkaoDB } from "../db.ts";

export default function register(app: any, ctx: any) {
  const getDb = (): GongkaoDB => {
    if ((ctx as any)._db) return (ctx as any)._db;
    throw new Error("Database not available");
  };

  // ── 知识条目列表 ────────────────────────────────────────────────────

  app.get("/knowledge", (c: any) => {
    const db = getDb();
    const subjectId = Number(c.req.query("subjectId")) || undefined;
    const moduleId = Number(c.req.query("moduleId")) || undefined;
    const category = c.req.query("category") as string | undefined;
    const search = c.req.query("search") as string | undefined;
    const limit = Number(c.req.query("limit")) || 50;
    const offset = Number(c.req.query("offset")) || 0;

    const entries = db.getKnowledgeEntries({
      subjectId,
      moduleId,
      category,
      search,
      limit,
      offset,
    });

    return c.json({ entries, limit, offset });
  });

  // ── 新增知识条目 ────────────────────────────────────────────────────

  app.post("/knowledge", async (c: any) => {
    const db = getDb();
    const body = await c.req.json();
    const { subject_id, module_id, title, content, category, tags } = body;

    if (!subject_id || !title || !content) {
      return c.json({ error: "subject_id, title and content required" }, 400);
    }

    const id = db.insertKnowledgeEntry({
      subject_id,
      module_id: module_id || null,
      title,
      content,
      category: category || "",
      tags: JSON.stringify(tags || []),
    });

    return c.json({ ok: true, id }, 201);
  });

  // ── 知识条目详情 ────────────────────────────────────────────────────

  app.get("/knowledge/:id", (c: any) => {
    const db = getDb();
    const id = Number(c.req.param("id"));
    const entries = db.getKnowledgeEntries({ limit: 1, offset: 0 });
    // 简单查询：用列表接口过滤
    const entry = db.raw.prepare("SELECT * FROM knowledge_entries WHERE id = ?").get(id);
    if (!entry) {
      return c.json({ error: "not_found" }, 404);
    }
    return c.json({ entry });
  });

  // ── 删除知识条目 ────────────────────────────────────────────────────

  app.delete("/knowledge/:id", (c: any) => {
    const db = getDb();
    const id = Number(c.req.param("id"));
    const ok = db.deleteKnowledgeEntry(id);
    if (!ok) {
      return c.json({ error: "not_found" }, 404);
    }
    return c.json({ ok: true });
  });

  // ── 分类列表 ────────────────────────────────────────────────────────

  app.get("/knowledge/categories", (c: any) => {
    const db = getDb();
    const rows = db.raw.prepare(
      "SELECT DISTINCT category FROM knowledge_entries WHERE category != '' ORDER BY category"
    ).all() as { category: string }[];
    return c.json({ categories: rows.map(r => r.category) });
  });
}
