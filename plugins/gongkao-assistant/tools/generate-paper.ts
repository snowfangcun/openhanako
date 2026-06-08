/**
 * 公考助手 — 智能组卷工具
 *
 * Agent 可调用此工具为用户生成练习试卷
 */

export const name = "generate_paper";
export const description = "根据用户需求智能组卷，生成公务员考试练习试卷。可指定科目、模块、难度，支持侧重薄弱模块。";

export const parameters = {
  type: "object",
  properties: {
    subject: {
      type: "string",
      description: "科目代码：xingce（行测）或 shenlun（申论）",
      enum: ["xingce", "shenlun"],
    },
    modules: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: { type: "string", description: "模块代码" },
          count: { type: "number", description: "该模块抽题数量" },
        },
        required: ["code", "count"],
      },
      description: "各模块抽题数量分布，如 [{code:'panduan',count:10}]",
    },
    difficulty: {
      type: "string",
      description: "难度偏好",
      enum: ["easy", "medium", "hard"],
    },
    focusWeakAreas: {
      type: "boolean",
      description: "是否侧重用户薄弱模块（根据历史正确率自动调整）",
    },
    count: {
      type: "number",
      description: "总题目数量（不指定模块分布时生效）",
    },
  },
  required: ["subject"],
};

export async function execute(input: any, toolCtx: any) {
  const { getDB } = await import("../index.ts");
  const db = getDB();

  const subjectObj = db.getSubjectByCode(input.subject);
  if (!subjectObj) {
    return "未找到该科目，请使用 xingce 或 shenlun";
  }

  let modules = input.modules;

  // 侧重薄弱模块
  if (input.focusWeakAreas && !modules) {
    const moduleStats = db.getModuleStats(subjectObj.id);
    const weakModules = moduleStats.filter((m: any) => m.practicedCount > 0 && m.accuracy < 70);
    if (weakModules.length > 0) {
      modules = weakModules.slice(0, 3).map((m: any) => ({ code: m.moduleName, count: 10 }));
    }
  }

  // 默认均匀分配
  if (!modules || modules.length === 0) {
    const allModules = db.getModules(subjectObj.id);
    const total = input.count || 40;
    const perModule = Math.ceil(total / allModules.length);
    modules = allModules.map((m: any) => ({ code: m.code, count: perModule }));
  }

  const allQuestions: any[] = [];
  const usedIds: number[] = [];

  for (const modSpec of modules) {
    const mod = db.getModuleByCode(subjectObj.id, modSpec.code);
    if (!mod) continue;
    const questions = db.pickRandomQuestions({
      subjectId: subjectObj.id,
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
    return "题库中暂无符合条件的题目，请先导入题库数据。可在设置中导入题库，或让我帮你导入示例题目。";
  }

  // 保存试卷
  const paperId = db.insertGeneratedPaper({
    template_id: null,
    name: `${subjectObj.name}智能组卷 ${new Date().toLocaleDateString("zh-CN")}`,
    subject_id: subjectObj.id,
    question_ids: JSON.stringify(allQuestions.map((q: any) => q.id)),
    total_score: allQuestions.length,
    time_limit_min: Math.ceil(allQuestions.length * 1.5),
  });

  const moduleSummary = modules.map((m: any) => `${m.code}: ${m.count}题`).join(", ");

  return `智能组卷完成！\n\n试卷ID: ${paperId}\n科目: ${subjectObj.name}\n题目数: ${allQuestions.length}\n模块分布: ${moduleSummary}\n建议用时: ${Math.ceil(allQuestions.length * 1.5)}分钟\n\n你可以在公考助手页面开始答题，或让我逐题出题。`;
}
