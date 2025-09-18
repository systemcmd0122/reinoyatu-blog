import { GoogleGenerativeAI } from "@google/generative-ai";
import { GenerationOptions } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
};

// スタイルIDを具体的な指示にマッピング
const styleInstructionMap: { [key: string]: string } = {
  professional: "ビジネス文書として通用する、プロフェッショナルで洗練されたトーンで記述してください。専門用語を適切に用い、客観的で信頼性の高い文章を心がけてください。",
  casual: "親しみやすく、読者が気軽に読めるようなカジュアルなトーンで記述してください。会話に近い自然な表現を使い、絵文字を効果的に（ただし過度ではなく）使用しても構いません。",
  technical: "技術的な内容を正確かつ明確に記述してください。専門用語は一貫して使用し、必要であれば簡単な注釈を加えてください。コードブロックや専門用語のフォーマットは維持してください。",
  educational: "教育的な観点から、読者が新しい知識を学べるように記述してください。複雑な概念は簡単な言葉で説明し、具体的な例を挙げて理解を助けてください。",
  storytelling: "物語を語るように、読者の興味を引きつけ、感情に訴えかけるようなスタイルで記述してください。序盤で読者の関心を引き、中盤で深掘りし、終盤で満足感のある結論を提示してください。",
  minimal: "冗長な表現を避け、要点を的確に伝えるミニマルなスタイルで記述してください。一文一文を短く、簡潔に保ち、最も重要な情報だけを抽出してください。"
};

export const generateBlogContent = async (
  title: string,
  content: string,
  styles: string[],
  options: GenerationOptions
) => {
  const model = getGeminiModel();

  const {
    keepStructure = true,
    preserveLinks = true,
    enhanceReadability = true,
    summaryLength,
  } = options;

  // 組み立てられたプロンプト
  const styleInstructions = styles.map(s => styleInstructionMap[s]).filter(Boolean);

  const prompt = `
あなたはプロのブログ記事編集者です。以下の指示に基づき、与えられたブログ記事を最高の品質に改善してください。

### 元の記事
タイトル: ${title}
内容:
${content}

### 編集指示
${styleInstructions.length > 0 ? `
**文体とトーン:**
${styleInstructions.map(instr => `- ${instr}`).join("\n")}
` : ""}

**構成とフォーマット:**
- ${keepStructure ? "元の見出し、リスト、段落構造を可能な限り維持してください。" : "より論理的で読みやすいように、文章構造を再構成してください。"}
- ${preserveLinks ? "記事内のすべてのハイパーリンクは、URLとアンカーテキストを含めて完全に保持してください。" : "リンクは不要であれば削除しても構いません。"}
- ${enhanceReadability ? "読者が内容を理解しやすいように、適切な箇所で改行や段落の分割を行ってください。一文が長くなりすぎないように注意してください。" : ""}

${summaryLength ? `
**要約:**
- 記事の冒頭に、内容を要約した文章を${summaryLength === 'short' ? '短い（3文程度）' : summaryLength === 'medium' ? '中程度（5文程度）' : '詳細な'}長さで追加してください。
` : ""}

### 出力形式
- 改善後の記事本文のみをMarkdown形式で出力してください。
- 指示に関するコメントや、前置き・後書きは一切含めないでください。
- 元の記事に含まれるコードブロックやMarkdownの特殊構文（テーブル、引用など）は、その形式を維持してください。

**このサイト独自のMarkdown形式:**
- **インラインコード:** バッククォート (\`) でテキストを囲むと、インラインコードとしてスタイルが適用されます。例: \`const a = 1;\`
- **ネタバレ:** テキストを2つのパイプ \`||\` で囲むか、行頭に \`/spoiler\` を付けると、クリックするまで内容が隠されるネタバレ防止タグになります。例: \`||隠されたテキスト||\` または \`/spoiler 隠されたテキスト\`
- **YouTube埋め込み:** \`{{youtube:VIDEO_ID}}\` という形式でYouTube動画を埋め込めます。\`showDetails=false\` オプションを追加すると、動画の詳細情報を非表示にできます。例: \`{{youtube:XXXXXXXXXXX:showDetails=false}}\`
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return { content: text.trim(), error: null };
  } catch (error) {
    console.error("Error generating content:", error);
    return {
      content: null,
      error: "AI処理中にエラーが発生しました。時間をおいて再度お試しください。",
    };
  }
};

export const generateTags = async (title: string, content: string): Promise<{ tags: string[] | null; error: string | null }> => {
  const model = getGeminiModel();

  const prompt = `
あなたはプロのSEO専門家であり、コンテンツアナリストです。
以下のブログ記事のタイトルと内容を読み込み、記事の主要なテーマ、トピック、キーワードを正確に特定してください。
記事の内容を最もよく表す、関連性の高いタグを3〜5個生成してください。

タグの条件:
- 各タグは簡潔で、単一の単語または短いフレーズであること。
- 記事の内容に直接関連していること。
- SEOに役立つキーワードであること。
- 重複するタグは避けること。

出力形式:
- 生成されたタグのみをカンマ区切りで出力してください。
- 他のテキスト、説明、コメント、箇条書きなどは一切含めないでください。

例:
記事タイトル: Next.jsとSupabaseでブログを構築
記事内容: この記事では、Next.jsのApp RouterとSupabaseを組み合わせて、スケーラブルなブログアプリケーションを構築する方法を解説します。認証、データベース、ストレージの統合について詳しく説明します。

出力例: Next.js, Supabase, Web開発, 認証, データベース

---
記事タイトル: ${title}
記事内容:
${content}
---

出力:
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const tags = text.split(',').map(tag => tag.trim()).filter(Boolean);
    return { tags, error: null };
  } catch (error) {
    console.error("Error generating tags:", error);
    return { tags: null, error: "タグの自動生成中にエラーが発生しました。時間をおいて再度お試しください。" };
  }
};
