/**
 * 公考助手 — AI错题解析工具
 *
 * Agent 可调用此工具对错题进行详细解析
 */

export const name = "analyze_mistake";
export const description = "对错题进行AI详细解析，分析错误原因、涉及知识点、解题思路，并给出学习建议。";

export const parameters = {
  type: "object",
  properties: {
    questionId: {
      type: "number",
      description: "题目ID",
    },
    userAnswer: {
      type: "string",
      description: "用户的错误答案（可选，用于分析错误思路）",
    },
  },
  required: ["questionId"],
};

export async function execute(input: any, toolCtx: any) {
  const { questionId, userAnswer } = input;

  let question: any = null;
  let wrongEntry: any = null;

  try {
    const { getDB } = await import("../index.ts");
    const db = getDB();
    question = db.getQuestionById(questionId);
    if (!question) {
      return "未找到该题目，请确认题目ID是否正确。";
    }

    // 查找错题记录
    const wrongQuestions = db.getWrongQuestions({ subjectId: question.subject_id, mastered: 0, limit: 50 });
    wrongEntry = wrongQuestions.find((w: any) => w.question_id === questionId);

    // 标记已复习
    if (wrongEntry) {
      db.markWrongQuestionReviewed(wrongEntry.id, false);
    }
  } catch {
    // 数据库不可用时仍可解析
  }

  if (!question) {
    return "未找到该题目。";
  }

  const subjectNames: Record<string, string> = { xingce: "行测", shenlun: "申论" };

  const prompt = `你是一位经验丰富的公务员考试辅导老师。请对以下错题进行详细解析：

## 科目
${question.subject_id === 1 ? "行测" : "申论"}

## 题目
${question.content}

${question.options ? `## 选项\n${question.options}` : ""}

## 正确答案
${question.answer}

## 原有解析
${question.explanation || "无"}

${userAnswer ? `## 用户答案（错误）\n${userAnswer}\n\n请重点分析用户可能的错误思路` : ""}

请从以下角度分析：
1. **错误原因**：分析可能的错误思路和常见陷阱
2. **核心知识点**：本题涉及的核心知识点
3. **解题思路**：正确的解题步骤和方法
4. **举一反三**：同类题目的解题技巧
5. **学习建议**：针对该知识点的复习建议`;

  const result = await toolCtx.bus.request("model:sample-text", {
    systemPrompt: "你是一位专业的公务员考试辅导老师，擅长分析错题并给出针对性建议。请用中文回答，格式清晰，重点突出。",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
    maxTokens: 2000,
  });

  return (result as any).text || "解析生成失败，请稍后重试。";
}
