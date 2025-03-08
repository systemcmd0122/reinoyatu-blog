import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
};

export const generateBlogContent = async (
  title: string,
  content: string,
  style?: string
) => {
  const model = getGeminiModel();

  const prompt = `
以下のブログ記事を編集・改善してください。
スタイル: ${style || "読みやすく、魅力的な文章にする"}

タイトル: ${title}

内容:
${content}

以下の点に注意して編集してください：
1. オリジナルの意図や主要なメッセージを保持する
2. 文章を明確で魅力的にする
3. 適切な段落分けと構造化を行う
4. 必要に応じて小見出しを追加する
5. Markdown形式で返す
6. 内容のみを返す（応答の文章はいらない）

編集後の記事を返してください。
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return { content: text, error: null };
  } catch (error) {
    console.error("Error generating content:", error);
    return {
      content: null,
      error: "AI処理中にエラーが発生しました。もう一度お試しください。",
    };
  }
};