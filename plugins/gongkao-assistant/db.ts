/**
 * 公考助手 — 数据库层
 *
 * 使用 better-sqlite3 管理 SQLite 数据库，包含：
 * - 科目/模块体系
 * - 题库（行测客观题 + 申论题目）
 * - 答题记录
 * - 申论答卷与 AI 评分
 * - 错题本
 * - 知识库
 * - 组卷模板
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// ── 类型定义 ──────────────────────────────────────────────────────────

export interface Subject {
  id: number;
  name: string;
  code: string; // xingce | shenlun
}

export interface Module {
  id: number;
  subject_id: number;
  name: string;
  code: string;
}

export interface Question {
  id: number;
  subject_id: number;
  module_id: number;
  type: QuestionType;
  difficulty: Difficulty;
  content: string;
  options: string | null; // JSON string for choice questions
  answer: string;
  explanation: string;
  tags: string; // JSON string
  source: string;
  year: number | null;
  created_at: string;
  updated_at: string;
}

export type QuestionType = "single_choice" | "multi_choice" | "judge" | "fill" | "essay_prompt";
export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface PracticeRecord {
  id: number;
  question_id: number;
  user_answer: string;
  is_correct: number; // 0 | 1
  time_spent_ms: number;
  created_at: string;
}

export interface EssaySubmission {
  id: number;
  module_id: number;
  topic: string;
  requirements: string;
  user_essay: string;
  word_count: number;
  ai_score: number | null;
  ai_feedback: string | null;
  ai_details: string | null; // JSON: 分项评分
  scored_at: string | null;
  created_at: string;
}

export interface WrongQuestion {
  id: number;
  question_id: number;
  practice_record_id: number;
  review_count: number;
  last_reviewed_at: string | null;
  mastered: number; // 0 | 1
  created_at: string;
}

export interface KnowledgeEntry {
  id: number;
  subject_id: number;
  module_id: number | null;
  title: string;
  content: string;
  category: string;
  tags: string; // JSON
  created_at: string;
  updated_at: string;
}

export interface PaperTemplate {
  id: number;
  name: string;
  subject_id: number;
  rules: string; // JSON: [{ moduleId, count, difficulty }]
  total_score: number;
  time_limit_min: number;
  created_at: string;
}

export interface GeneratedPaper {
  id: number;
  template_id: number | null;
  name: string;
  subject_id: number;
  question_ids: string; // JSON: number[]
  total_score: number;
  time_limit_min: number;
  created_at: string;
}

// ── 数据库初始化 ──────────────────────────────────────────────────────

const SCHEMA_VERSION = 1;

const SCHEMA_SQL = `
-- 科目
CREATE TABLE IF NOT EXISTS subjects (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL,
  code  TEXT NOT NULL UNIQUE
);

-- 模块
CREATE TABLE IF NOT EXISTS modules (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id  INTEGER NOT NULL REFERENCES subjects(id),
  name        TEXT NOT NULL,
  code        TEXT NOT NULL,
  UNIQUE(subject_id, code)
);

-- 题库
CREATE TABLE IF NOT EXISTS questions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id  INTEGER NOT NULL REFERENCES subjects(id),
  module_id   INTEGER NOT NULL REFERENCES modules(id),
  type        TEXT NOT NULL CHECK(type IN ('single_choice','multi_choice','judge','fill','essay_prompt')),
  difficulty  TEXT NOT NULL DEFAULT 'medium' CHECK(difficulty IN ('easy','medium','hard','expert')),
  content     TEXT NOT NULL,
  options     TEXT,            -- JSON: 选项数组
  answer      TEXT NOT NULL,
  explanation TEXT NOT NULL DEFAULT '',
  tags        TEXT NOT NULL DEFAULT '[]',  -- JSON
  source      TEXT NOT NULL DEFAULT '',
  year        INTEGER,
  created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- 答题记录
CREATE TABLE IF NOT EXISTS practice_records (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id    INTEGER NOT NULL REFERENCES questions(id),
  user_answer    TEXT NOT NULL,
  is_correct     INTEGER NOT NULL DEFAULT 0 CHECK(is_correct IN (0,1)),
  time_spent_ms  INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- 申论答卷
CREATE TABLE IF NOT EXISTS essay_submissions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id   INTEGER NOT NULL REFERENCES modules(id),
  topic       TEXT NOT NULL,
  requirements TEXT NOT NULL DEFAULT '',
  user_essay  TEXT NOT NULL,
  word_count  INTEGER NOT NULL DEFAULT 0,
  ai_score    REAL,
  ai_feedback TEXT,
  ai_details  TEXT,            -- JSON: 分项评分
  scored_at   TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- 错题本
CREATE TABLE IF NOT EXISTS wrong_questions (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id         INTEGER NOT NULL REFERENCES questions(id),
  practice_record_id  INTEGER NOT NULL REFERENCES practice_records(id),
  review_count        INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at    TEXT,
  mastered            INTEGER NOT NULL DEFAULT 0 CHECK(mastered IN (0,1)),
  created_at          TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- 知识库
CREATE TABLE IF NOT EXISTS knowledge_entries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id  INTEGER NOT NULL REFERENCES subjects(id),
  module_id   INTEGER REFERENCES modules(id),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT '',
  tags        TEXT NOT NULL DEFAULT '[]',
  created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- 组卷模板
CREATE TABLE IF NOT EXISTS paper_templates (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  subject_id      INTEGER NOT NULL REFERENCES subjects(id),
  rules           TEXT NOT NULL DEFAULT '[]',  -- JSON
  total_score     INTEGER NOT NULL DEFAULT 100,
  time_limit_min  INTEGER NOT NULL DEFAULT 120,
  created_at      TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- 已生成试卷
CREATE TABLE IF NOT EXISTS generated_papers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id     INTEGER REFERENCES paper_templates(id),
  name            TEXT NOT NULL,
  subject_id      INTEGER NOT NULL REFERENCES subjects(id),
  question_ids    TEXT NOT NULL DEFAULT '[]',  -- JSON
  total_score     INTEGER NOT NULL DEFAULT 100,
  time_limit_min  INTEGER NOT NULL DEFAULT 120,
  created_at      TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_questions_subject_module ON questions(subject_id, module_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_practice_records_question ON practice_records(question_id);
CREATE INDEX IF NOT EXISTS idx_practice_records_created ON practice_records(created_at);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_question ON wrong_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_mastered ON wrong_questions(mastered);
CREATE INDEX IF NOT EXISTS idx_essay_submissions_module ON essay_submissions(module_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_subject ON knowledge_entries(subject_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_module ON knowledge_entries(module_id);

-- Schema 版本
CREATE TABLE IF NOT EXISTS _schema_meta (key TEXT PRIMARY KEY, value TEXT);
INSERT OR IGNORE INTO _schema_meta (key, value) VALUES ('version', '${SCHEMA_VERSION}');
`;

// ── 种子数据 ──────────────────────────────────────────────────────────

const SEED_SUBJECTS_SQL = `
INSERT OR IGNORE INTO subjects (id, name, code) VALUES (1, '行测', 'xingce');
INSERT OR IGNORE INTO subjects (id, name, code) VALUES (2, '申论', 'shenlun');

INSERT OR IGNORE INTO modules (id, subject_id, name, code) VALUES (1,  1, '言语理解与表达', 'yanyu');
INSERT OR IGNORE INTO modules (id, subject_id, name, code) VALUES (2,  1, '判断推理', 'panduan');
INSERT OR IGNORE INTO modules (id, subject_id, name, code) VALUES (3,  1, '资料分析', 'ziliao');
INSERT OR IGNORE INTO modules (id, subject_id, name, code) VALUES (4,  1, '数量关系', 'shuliang');
INSERT OR IGNORE INTO modules (id, subject_id, name, code) VALUES (5,  1, '常识判断', 'changshi');
INSERT OR IGNORE INTO modules (id, subject_id, name, code) VALUES (6,  2, '归纳概括', 'guina');
INSERT OR IGNORE INTO modules (id, subject_id, name, code) VALUES (7,  2, '提出对策', 'tichu');
INSERT OR IGNORE INTO modules (id, subject_id, name, code) VALUES (8,  2, '综合分析', 'zonghe');
INSERT OR IGNORE INTO modules (id, subject_id, name, code) VALUES (9,  2, '贯彻执行', 'guanche');
INSERT OR IGNORE INTO modules (id, subject_id, name, code) VALUES (10, 2, '大作文', 'dawen');
`;

// ── 数据库管理类 ──────────────────────────────────────────────────────

export class GongkaoDB {
  private db: Database.Database;

  constructor(dataDir: string) {
    const dbDir = path.join(dataDir, "db");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = path.join(dbDir, "gongkao.db");
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.db.pragma("busy_timeout = 5000");
  }

  init(): void {
    this.db.exec(SCHEMA_SQL);
    this.db.exec(SEED_SUBJECTS_SQL);
  }

  close(): void {
    this.db.close();
  }

  get raw(): Database.Database {
    return this.db;
  }

  // ── 科目 & 模块 ────────────────────────────────────────────────────

  getSubjects(): Subject[] {
    return this.db.prepare("SELECT * FROM subjects ORDER BY id").all() as Subject[];
  }

  getModules(subjectId?: number): Module[] {
    if (subjectId) {
      return this.db.prepare("SELECT * FROM modules WHERE subject_id = ? ORDER BY id").all(subjectId) as Module[];
    }
    return this.db.prepare("SELECT * FROM modules ORDER BY id").all() as Module[];
  }

  getSubjectByCode(code: string): Subject | undefined {
    return this.db.prepare("SELECT * FROM subjects WHERE code = ?").get(code) as Subject | undefined;
  }

  getModuleByCode(subjectId: number, code: string): Module | undefined {
    return this.db.prepare("SELECT * FROM modules WHERE subject_id = ? AND code = ?").get(subjectId, code) as Module | undefined;
  }

  // ── 题库 ────────────────────────────────────────────────────────────

  getQuestions(filter: {
    subjectId?: number;
    moduleId?: number;
    type?: QuestionType;
    difficulty?: Difficulty;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Question[] {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter.subjectId) {
      conditions.push("subject_id = ?");
      params.push(filter.subjectId);
    }
    if (filter.moduleId) {
      conditions.push("module_id = ?");
      params.push(filter.moduleId);
    }
    if (filter.type) {
      conditions.push("type = ?");
      params.push(filter.type);
    }
    if (filter.difficulty) {
      conditions.push("difficulty = ?");
      params.push(filter.difficulty);
    }
    if (filter.tags && filter.tags.length > 0) {
      const tagConditions = filter.tags.map(() => "tags LIKE ?");
      conditions.push(`(${tagConditions.join(" OR ")})`);
      params.push(...filter.tags.map((t) => `%"${t}"%`));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = filter.limit ?? 50;
    const offset = filter.offset ?? 0;

    return this.db.prepare(
      `SELECT * FROM questions ${where} ORDER BY id DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as Question[];
  }

  getQuestionById(id: number): Question | undefined {
    return this.db.prepare("SELECT * FROM questions WHERE id = ?").get(id) as Question | undefined;
  }

  getQuestionCount(filter?: { subjectId?: number; moduleId?: number; difficulty?: Difficulty }): number {
    const conditions: string[] = [];
    const params: any[] = [];
    if (filter?.subjectId) { conditions.push("subject_id = ?"); params.push(filter.subjectId); }
    if (filter?.moduleId) { conditions.push("module_id = ?"); params.push(filter.moduleId); }
    if (filter?.difficulty) { conditions.push("difficulty = ?"); params.push(filter.difficulty); }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const row = this.db.prepare(`SELECT COUNT(*) as cnt FROM questions ${where}`).get(...params) as any;
    return row?.cnt ?? 0;
  }

  insertQuestion(q: Omit<Question, "id" | "created_at" | "updated_at">): number {
    const stmt = this.db.prepare(`
      INSERT INTO questions (subject_id, module_id, type, difficulty, content, options, answer, explanation, tags, source, year)
      VALUES (@subject_id, @module_id, @type, @difficulty, @content, @options, @answer, @explanation, @tags, @source, @year)
    `);
    const result = stmt.run(q);
    return result.lastInsertRowid as number;
  }

  insertQuestionsBatch(questions: Omit<Question, "id" | "created_at" | "updated_at">[]): number {
    const stmt = this.db.prepare(`
      INSERT INTO questions (subject_id, module_id, type, difficulty, content, options, answer, explanation, tags, source, year)
      VALUES (@subject_id, @module_id, @type, @difficulty, @content, @options, @answer, @explanation, @tags, @source, @year)
    `);
    const insertMany = this.db.transaction((items: typeof questions) => {
      let count = 0;
      for (const q of items) {
        stmt.run(q);
        count++;
      }
      return count;
    });
    return insertMany(questions);
  }

  deleteQuestion(id: number): boolean {
    const result = this.db.prepare("DELETE FROM questions WHERE id = ?").run(id);
    return result.changes > 0;
  }

  // ── 随机抽题（组卷核心） ────────────────────────────────────────────

  pickRandomQuestions(filter: {
    subjectId?: number;
    moduleId?: number;
    difficulty?: Difficulty;
    count: number;
    excludeIds?: number[];
  }): Question[] {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter.subjectId) { conditions.push("subject_id = ?"); params.push(filter.subjectId); }
    if (filter.moduleId) { conditions.push("module_id = ?"); params.push(filter.moduleId); }
    if (filter.difficulty) { conditions.push("difficulty = ?"); params.push(filter.difficulty); }
    if (filter.excludeIds && filter.excludeIds.length > 0) {
      conditions.push(`id NOT IN (${filter.excludeIds.map(() => "?").join(",")})`);
      params.push(...filter.excludeIds);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return this.db.prepare(
      `SELECT * FROM questions ${where} ORDER BY RANDOM() LIMIT ?`
    ).all(...params, filter.count) as Question[];
  }

  // ── 答题记录 ────────────────────────────────────────────────────────

  insertPracticeRecord(r: Omit<PracticeRecord, "id" | "created_at">): number {
    const stmt = this.db.prepare(`
      INSERT INTO practice_records (question_id, user_answer, is_correct, time_spent_ms)
      VALUES (@question_id, @user_answer, @is_correct, @time_spent_ms)
    `);
    const result = stmt.run(r);
    return result.lastInsertRowid as number;
  }

  insertPracticeRecordsBatch(records: Omit<PracticeRecord, "id" | "created_at">[]): void {
    const stmt = this.db.prepare(`
      INSERT INTO practice_records (question_id, user_answer, is_correct, time_spent_ms)
      VALUES (@question_id, @user_answer, @is_correct, @time_spent_ms)
    `);
    const insertMany = this.db.transaction((items: typeof records) => {
      for (const r of items) stmt.run(r);
    });
    insertMany(records);
  }

  getPracticeStats(filter?: { subjectId?: number; moduleId?: number; since?: string }): {
    total: number;
    correct: number;
    accuracy: number;
    avgTimeMs: number;
  } {
    const conditions: string[] = [];
    const params: any[] = [];
    if (filter?.subjectId) {
      conditions.push("q.subject_id = ?");
      params.push(filter.subjectId);
    }
    if (filter?.moduleId) {
      conditions.push("q.module_id = ?");
      params.push(filter.moduleId);
    }
    if (filter?.since) {
      conditions.push("pr.created_at >= ?");
      params.push(filter.since);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const row = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(pr.is_correct) as correct,
        AVG(pr.time_spent_ms) as avgTimeMs
      FROM practice_records pr
      JOIN questions q ON q.id = pr.question_id
      ${where}
    `).get(...params) as any;

    const total = row?.total ?? 0;
    const correct = row?.correct ?? 0;
    return {
      total,
      correct,
      accuracy: total > 0 ? Math.round((correct / total) * 10000) / 100 : 0,
      avgTimeMs: Math.round(row?.avgTimeMs ?? 0),
    };
  }

  // ── 错题本 ──────────────────────────────────────────────────────────

  addWrongQuestion(questionId: number, practiceRecordId: number): number {
    // 如果已存在同一题目的未掌握错题，更新复习计数；否则新增
    const existing = this.db.prepare(
      "SELECT id FROM wrong_questions WHERE question_id = ? AND mastered = 0"
    ).get(questionId) as { id: number } | undefined;

    if (existing) {
      this.db.prepare(
        "UPDATE wrong_questions SET review_count = review_count + 1, practice_record_id = ? WHERE id = ?"
      ).run(practiceRecordId, existing.id);
      return existing.id;
    }

    const stmt = this.db.prepare(`
      INSERT INTO wrong_questions (question_id, practice_record_id)
      VALUES (?, ?)
    `);
    const result = stmt.run(questionId, practiceRecordId);
    return result.lastInsertRowid as number;
  }

  getWrongQuestions(filter: {
    subjectId?: number;
    moduleId?: number;
    mastered?: number;
    limit?: number;
    offset?: number;
  }): (WrongQuestion & { question: Question })[] {
    const conditions: string[] = ["1=1"];
    const params: any[] = [];

    if (filter.subjectId) { conditions.push("q.subject_id = ?"); params.push(filter.subjectId); }
    if (filter.moduleId) { conditions.push("q.module_id = ?"); params.push(filter.moduleId); }
    if (filter.mastered !== undefined) { conditions.push("wq.mastered = ?"); params.push(filter.mastered); }

    const limit = filter.limit ?? 50;
    const offset = filter.offset ?? 0;

    return this.db.prepare(`
      SELECT wq.*, q.id as q_id, q.subject_id, q.module_id, q.type, q.difficulty,
             q.content, q.options, q.answer, q.explanation, q.tags, q.source, q.year
      FROM wrong_questions wq
      JOIN questions q ON q.id = wq.question_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY wq.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];
  }

  markWrongQuestionReviewed(id: number, mastered: boolean): void {
    this.db.prepare(`
      UPDATE wrong_questions
      SET review_count = review_count + 1, last_reviewed_at = datetime('now','localtime'), mastered = ?
      WHERE id = ?
    `).run(mastered ? 1 : 0, id);
  }

  getWrongQuestionCount(filter?: { subjectId?: number; mastered?: number }): number {
    const conditions: string[] = ["1=1"];
    const params: any[] = [];
    if (filter?.subjectId) {
      conditions.push("q.subject_id = ?");
      params.push(filter.subjectId);
    }
    if (filter?.mastered !== undefined) {
      conditions.push("wq.mastered = ?");
      params.push(filter.mastered);
    }
    const row = this.db.prepare(`
      SELECT COUNT(*) as cnt FROM wrong_questions wq
      JOIN questions q ON q.id = wq.question_id
      WHERE ${conditions.join(" AND ")}
    `).get(...params) as any;
    return row?.cnt ?? 0;
  }

  // ── 申论答卷 ────────────────────────────────────────────────────────

  insertEssaySubmission(e: Omit<EssaySubmission, "id" | "ai_score" | "ai_feedback" | "ai_details" | "scored_at" | "created_at">): number {
    const stmt = this.db.prepare(`
      INSERT INTO essay_submissions (module_id, topic, requirements, user_essay, word_count)
      VALUES (@module_id, @topic, @requirements, @user_essay, @word_count)
    `);
    const result = stmt.run(e);
    return result.lastInsertRowid as number;
  }

  updateEssayScore(id: number, score: number, feedback: string, details: string): void {
    this.db.prepare(`
      UPDATE essay_submissions
      SET ai_score = ?, ai_feedback = ?, ai_details = ?, scored_at = datetime('now','localtime')
      WHERE id = ?
    `).run(score, feedback, details, id);
  }

  getEssaySubmissions(filter?: { moduleId?: number; limit?: number; offset?: number }): EssaySubmission[] {
    const conditions: string[] = [];
    const params: any[] = [];
    if (filter?.moduleId) { conditions.push("module_id = ?"); params.push(filter.moduleId); }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = filter?.limit ?? 20;
    const offset = filter?.offset ?? 0;
    return this.db.prepare(
      `SELECT * FROM essay_submissions ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as EssaySubmission[];
  }

  getEssaySubmissionById(id: number): EssaySubmission | undefined {
    return this.db.prepare("SELECT * FROM essay_submissions WHERE id = ?").get(id) as EssaySubmission | undefined;
  }

  // ── 知识库 ──────────────────────────────────────────────────────────

  getKnowledgeEntries(filter: {
    subjectId?: number;
    moduleId?: number;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): KnowledgeEntry[] {
    const conditions: string[] = [];
    const params: any[] = [];
    if (filter.subjectId) { conditions.push("subject_id = ?"); params.push(filter.subjectId); }
    if (filter.moduleId) { conditions.push("module_id = ?"); params.push(filter.moduleId); }
    if (filter.category) { conditions.push("category = ?"); params.push(filter.category); }
    if (filter.search) {
      conditions.push("(title LIKE ? OR content LIKE ?)");
      params.push(`%${filter.search}%`, `%${filter.search}%`);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = filter.limit ?? 50;
    const offset = filter.offset ?? 0;
    return this.db.prepare(
      `SELECT * FROM knowledge_entries ${where} ORDER BY id DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as KnowledgeEntry[];
  }

  insertKnowledgeEntry(e: Omit<KnowledgeEntry, "id" | "created_at" | "updated_at">): number {
    const stmt = this.db.prepare(`
      INSERT INTO knowledge_entries (subject_id, module_id, title, content, category, tags)
      VALUES (@subject_id, @module_id, @title, @content, @category, @tags)
    `);
    const result = stmt.run(e);
    return result.lastInsertRowid as number;
  }

  deleteKnowledgeEntry(id: number): boolean {
    const result = this.db.prepare("DELETE FROM knowledge_entries WHERE id = ?").run(id);
    return result.changes > 0;
  }

  // ── 组卷模板 ────────────────────────────────────────────────────────

  getPaperTemplates(subjectId?: number): PaperTemplate[] {
    if (subjectId) {
      return this.db.prepare("SELECT * FROM paper_templates WHERE subject_id = ? ORDER BY id").all(subjectId) as PaperTemplate[];
    }
    return this.db.prepare("SELECT * FROM paper_templates ORDER BY id").all() as PaperTemplate[];
  }

  insertPaperTemplate(t: Omit<PaperTemplate, "id" | "created_at">): number {
    const stmt = this.db.prepare(`
      INSERT INTO paper_templates (name, subject_id, rules, total_score, time_limit_min)
      VALUES (@name, @subject_id, @rules, @total_score, @time_limit_min)
    `);
    const result = stmt.run(t);
    return result.lastInsertRowid as number;
  }

  // ── 已生成试卷 ──────────────────────────────────────────────────────

  insertGeneratedPaper(p: Omit<GeneratedPaper, "id" | "created_at">): number {
    const stmt = this.db.prepare(`
      INSERT INTO generated_papers (template_id, name, subject_id, question_ids, total_score, time_limit_min)
      VALUES (@template_id, @name, @subject_id, @question_ids, @total_score, @time_limit_min)
    `);
    const result = stmt.run(p);
    return result.lastInsertRowid as number;
  }

  getGeneratedPapers(subjectId?: number, limit = 20): GeneratedPaper[] {
    if (subjectId) {
      return this.db.prepare("SELECT * FROM generated_papers WHERE subject_id = ? ORDER BY created_at DESC LIMIT ?").all(subjectId, limit) as GeneratedPaper[];
    }
    return this.db.prepare("SELECT * FROM generated_papers ORDER BY created_at DESC LIMIT ?").all(limit) as GeneratedPaper[];
  }

  getGeneratedPaperById(id: number): GeneratedPaper | undefined {
    return this.db.prepare("SELECT * FROM generated_papers WHERE id = ?").get(id) as GeneratedPaper | undefined;
  }

  // ── 模块级统计 ──────────────────────────────────────────────────────

  getModuleStats(subjectId: number): {
    moduleId: number;
    moduleName: string;
    questionCount: number;
    practicedCount: number;
    correctCount: number;
    accuracy: number;
  }[] {
    return this.db.prepare(`
      SELECT
        m.id as moduleId,
        m.name as moduleName,
        COUNT(DISTINCT q.id) as questionCount,
        COUNT(DISTINCT pr.id) as practicedCount,
        SUM(CASE WHEN pr.is_correct = 1 THEN 1 ELSE 0 END) as correctCount,
        CASE WHEN COUNT(DISTINCT pr.id) > 0
          THEN ROUND(SUM(CASE WHEN pr.is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT pr.id), 2)
          ELSE 0
        END as accuracy
      FROM modules m
      LEFT JOIN questions q ON q.module_id = m.id
      LEFT JOIN practice_records pr ON pr.question_id = q.id
      WHERE m.subject_id = ?
      GROUP BY m.id, m.name
      ORDER BY m.id
    `).all(subjectId) as any[];
  }

  // ── 每日统计 ────────────────────────────────────────────────────────

  getDailyStats(days = 30): {
    date: string;
    total: number;
    correct: number;
    accuracy: number;
  }[] {
    return this.db.prepare(`
      SELECT
        DATE(pr.created_at) as date,
        COUNT(*) as total,
        SUM(pr.is_correct) as correct,
        ROUND(SUM(pr.is_correct) * 100.0 / COUNT(*), 2) as accuracy
      FROM practice_records pr
      WHERE pr.created_at >= DATE('now', '-' || ? || ' days', 'localtime')
      GROUP BY DATE(pr.created_at)
      ORDER BY date DESC
    `).all(days) as any[];
  }
}
