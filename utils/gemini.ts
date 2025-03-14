import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
};

interface GenerateOptions {
  keepStructure?: boolean;
  summaryLength?: 'short' | 'medium' | 'long';
  focusAreas?: string[];
  preserveLinks?: boolean;
  enhanceReadability?: boolean;
}

export const generateBlogContent = async (
  title: string,
  content: string,
  style?: string,
  options: GenerateOptions = {}
) => {
  const model = getGeminiModel();

  const {
    keepStructure = true,
    summaryLength,
    focusAreas = [],
    preserveLinks = true,
    enhanceReadability = true
  } = options;

  // スタイルに基づいた具体的な指示を生成
  const styleInstructions = style ? `
スタイルに関する具体的な指示:
${style.split(',').map(s => `- ${s.trim()}`).join('\n')}
  ` : '';

  // 文章構造に関する指示
  const structureInstructions = keepStructure ? `
- 元の文章構造を維持しながら改善
- 既存の見出し階層を保持
- コードブロックの形式を維持
` : '';

  // 要約指示（指定がある場合）
  const summaryInstructions = summaryLength ? `
- ${summaryLength === 'short' ? '3行程度' : summaryLength === 'medium' ? '5行程度' : '詳細な'}要約を冒頭に追加
` : '';

  const prompt = `
以下のブログ記事を編集・改善してください。

タイトル: ${title}

内容:
${content}

${styleInstructions}

編集方針:
1. 本文に関係のない内容は一切生成しない
2. オリジナルの意図や主要なメッセージを正確に保持
3. 技術的な正確性を維持
4. Markdown形式で出力
${structureInstructions}
${summaryInstructions}
${focusAreas.length > 0 ? `5. 以下の点に特に注力:\n${focusAreas.map(area => `- ${area}`).join('\n')}` : ''}

${preserveLinks ? '- 既存のリンクをすべて保持' : ''}
${enhanceReadability ? '- 読みやすさを向上（適切な改行、段落分け）' : ''}

編集後の記事を返してください。メタ情報や追加コメントは含めないでください。
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 生成されたテキストから不要な説明などを削除
    const cleanedText = text
      .replace(/^(Here's the edited version:|編集後の記事:|Generated content:)/i, '')
      .trim();

    return { content: cleanedText, error: null };
  } catch (error) {
    console.error("Error generating content:", error);
    return {
      content: null,
      error: "AI処理中にエラーが発生しました。もう一度お試しください。",
    };
  }
};

// プリセットテンプレートの定義
export const stylePresets = {
  technical: {
    label: "技術解説",
    styles: ["technical", "structured", "professional"],
    options: {
      keepStructure: true,
      preserveLinks: true,
      enhanceReadability: true,
      focusAreas: ["技術的な正確性", "段階的な説明", "コード例の明確化"]
    }
  },
  beginner_friendly: {
    label: "初心者向け",
    styles: ["educational", "casual", "step_by_step"],
    options: {
      keepStructure: true,
      summaryLength: 'short',
      enhanceReadability: true,
      focusAreas: ["基本概念の説明", "わかりやすい例示", "専門用語の解説"]
    }
  },
  professional_blog: {
    label: "プロフェッショナルブログ",
    styles: ["professional", "authoritative", "structured"],
    options: {
      keepStructure: true,
      summaryLength: 'medium',
      preserveLinks: true,
      focusAreas: ["専門的な分析", "信頼性の向上", "論理的な構成"]
    }
  }
};