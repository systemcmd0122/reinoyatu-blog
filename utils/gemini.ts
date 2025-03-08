import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

// Markdownガイドの内容
const MARKDOWN_GUIDE = `
# 使用可能なMarkdown構文

## 基本構文

### 見出し
- # 見出し1
- ## 見出し2

### テキスト装飾
- **太字**
- *斜体*

### リスト
- 箇条書きリスト
  - リスト項目
- 番号付きリスト
  1. 番号付きリスト

### リンクと画像
- リンク: [リンクテキスト](https://example.com)
- 画像: ![代替テキスト](https://example.com/image.jpg)

### コードブロック
\`\`\`言語名
コードブロック
\`\`\`

対応言語:
- javascript
- typescript
- jsx
- tsx
- html
- css
- python
- java
- csharp
- cpp

### 引用
> 引用文

### 区切り線
---

### YouTube埋め込み
- 基本: {{youtube:VIDEO_ID}}
- 詳細非表示: {{youtube:VIDEO_ID:showDetails=false}}
`;

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
5. Markdown形式で返す（以下の構文が使用可能です）

${MARKDOWN_GUIDE}

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

// Markdownガイドを取得する関数を追加
export const getMarkdownGuide = () => {
  return MARKDOWN_GUIDE;
};

// 指定された文字列がMarkdown構文として有効かチェックする関数
export const isValidMarkdown = (content: string): boolean => {
  // 基本的なMarkdown構文のパターン
  const patterns = {
    headers: /^#{1,6}\s.+$/m,
    lists: /^[-*+]\s.+$|^\d+\.\s.+$/m,
    codeBlocks: /```[\s\S]*?```/,
    links: /\[([^\]]+)\]\(([^)]+)\)/,
    images: /!\[([^\]]+)\]\(([^)]+)\)/,
    youtube: /{{youtube:[a-zA-Z0-9_-]+(:showDetails=(true|false))?}}/,
  };

  // 少なくとも1つのパターンにマッチすればtrue
  return Object.values(patterns).some(pattern => pattern.test(content));
};