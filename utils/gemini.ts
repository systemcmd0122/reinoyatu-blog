import { GoogleGenerativeAI } from "@google/generative-ai";
import { GenerationOptions } from "@/types";

const getApiKey = () => process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

export const getGeminiModel = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
};

// スタイルIDを具体的な指示にマッピング
const styleInstructionMap: { [key: string]: string } = {
  professional: "ビジネス文書として通用する、プロフェッショナルで洗練されたトーンで記述してください。専門用語を適切に用い、客観的で信頼性の高い文章を心がけてください。",
  casual: "親しみやすく、読者が気軽に読めるようなカジュアルなトーンで記述してください。会話に近い自然な表現を使ってください。",
  technical: "技術的な内容を正確かつ明確に記述してください。専門用語は一貫して使用し、必要であれば簡単な注釈を加えてください。コードブロックや専門用語のフォーマットは維持してください。",
  educational: "教育的な観点から、読者が新しい知識を学べるように記述してください。複雑な概念は簡単な言葉で説明し、具体的な例を挙げて理解を助けてください。",
  storytelling: "物語を語るように、読者の興味を引きつけ、感情に訴えかけるようなスタイルで記述してください。序盤で読者の関心を引き、中盤で深掘りし、終盤で満足感のある結論を提示してください。",
  minimal: "冗長な表現を避け、要点を的確に伝えるミニマルなスタイルで記述してください。一文一文を短く、簡潔に保ち、最も重要な情報だけを抽出してください。"
};

// サポートされているMarkdown記法のガイド
const getMarkdownGuide = (): string => {
  return `
### サポートされているMarkdown記法

**基本的なテキスト装飾:**
- **太字**: **太字** または __太字__
- *斜体*: *斜体* または _斜体_
- ~~取り消し線~~: ~~取り消し線~~
- インラインコード: \`コード\`

**見出し（6段階）:**
# 見出し1（最大）
## 見出し2
### 見出し3
#### 見出し4
##### 見出し5
###### 見出し6（最小）

**リスト:**
- 箇条書きリスト: - 項目 または * 項目
- 番号付きリスト: 1. 項目
- タスクリスト:
  - 未完了: - [ ] タスク
  - 完了: - [x] タスク

**リンクと画像:**
- リンク: [テキスト](URL)
- 画像: ![代替テキスト](画像URL)

**コードブロック:**
\`\`\`言語名
コードの内容
\`\`\`

**サポートされるプログラミング言語:**
javascript, typescript, jsx, tsx, html, css, python, java, csharp, cpp, c, php, ruby, go, rust, sql, json, yaml, bash, markdown, text

**引用:**
> 引用テキスト
> 複数行の引用も可能

**水平線:**
--- または *** または ___

**テーブル:**
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| セル1 | セル2 | セル3 |

**YouTube動画埋め込み:**
{{youtube:VIDEO_ID}} - 基本的な埋め込み
{{youtube:VIDEO_ID:showDetails=false}} - 詳細情報なしで埋め込み

**VIDEO_IDの取得方法:**
- 通常のURL: https://www.youtube.com/watch?v=**dQw4w9WgXcQ**
- 短縮URL: https://youtu.be/**dQw4w9WgXcQ**

### 重要な注意事項

1. **上記のMarkdown記法のみを使用すること**: リストにない記法や拡張構文は絶対に使用しないでください
2. **構文の正確性**: すべての開始タグには対応する終了タグが必要
3. **改行の重要性**: ブロック要素（見出し、リスト、コードブロック等）の前後には空行を入れる
4. **コードブロックの言語指定**: 可能な限りシンタックスハイライト用の言語を指定
5. **YouTube埋め込み**: 必ず新しい行に単独で配置すること

### スタイリングのベストプラクティス

1. **見出しの階層**: h1 → h2 → h3 の順序を守る
2. **リストの統一**: 同一レベルでは同じマーカー（-,*）を使用
3. **段落分け**: 適切に段落を分けて読みやすくする
4. **コードの明示**: 技術的な内容はコードブロックで明確に
5. **画像の代替テキスト**: 必ず説明を記述
6. **リンクの説明**: リンクテキストは内容を表す分かりやすい文言を使用

この記法を正確に使用して、読者にとって読みやすい文書を作成してください。
`;
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

  const styleInstructions = styles.map(s => styleInstructionMap[s]).filter(Boolean);

  const prompt = `
あなたは、与えられたMarkdownの仕様に従って記事を改善する優秀なブログ編集AIです。
以下の最優先事項を必ず守ってください：

1. 「サポートされているMarkdown記法」に記載されたルールを**厳密に**守ること。リストにない記法は絶対に使用しないでください。

2. 元の文章の趣旨、主張、意図を100%維持すること。以下は固く禁止されています：
   - 文章の主張や結論の変更
   - 重要な情報の削除や省略
   - 事実やデータの改変
   - 著者の意見や立場の変更

3. 文章の構造と読みやすさのみを改善すること：
   - Markdown記法の適切な適用
   - 段落分けの最適化
   - 箇条書きやリストの活用
   - 見出しレベルの適切な使用

${getMarkdownGuide()}

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
- ${keepStructure ? "元の見出し、リスト、段落構造を可能な限り維持してください。Markdown記法をより適切に使用して構造を明確化してください。" : "より論理的で読みやすいように、文章構造を再構成してください。適切な見出し階層を設定し、情報を整理してください。"}
- ${preserveLinks ? "記事内のすべてのハイパーリンクは、正しいMarkdown記法 [テキスト](URL) を使用して完全に保持してください。" : "リンクは不要であれば削除しても構いません。"}
- ${enhanceReadability ? "読者が内容を理解しやすいように、適切な見出し（h2, h3等）、リスト、段落分けを行ってください。長い文章は読みやすい長さに分割してください。" : ""}

**基本的な改善ポイント:**
1. **テキストの強調**: 重要なポイントは**太字**で強調
2. **コードの明示**: 技術的な内容はコードブロックで囲む（言語指定必須）
3. **リスト化**: 複数の項目は箇条書きまたは番号付きリストで整理
4. **引用の活用**: 他の情報源からの引用は > を使用
5. **テーブルの利用**: 比較や一覧表示にはテーブルを活用

${summaryLength ? `
**要約:**
- 記事の冒頭に、内容を要約した文章を${summaryLength === 'short' ? '短い（3文程度）' : summaryLength === 'medium' ? '中程度（5文程度）' : '詳細な（7-10文程度）'}長さで追加してください。
- 要約は引用形式（>）を使用して見やすく表示してください。
` : ""}

### 品質チェックリスト
改善後の記事が以下の条件を満たしているか確認してください：

1. **Markdown記法の正確性**
   - すべての見出し（#, ##, ###等）が正しく記述されている
   - リストのマーカー（-, *）が統一されている
   - コードブロックの言語指定が適切
   - リンクの記法 [テキスト](URL) が正確
   - 画像の記法 ![alt](URL) が正確

2. **構造の明確性**
   - 見出しの階層が論理的（h1→h2→h3の順序）
   - 段落の分割が適切
   - リストや引用が効果的に使用されている

3. **読みやすさ**
   - 一つの段落が長すぎない（3-5文程度）
   - 専門用語には適切な説明
   - 重要な情報が太字やリストで際立っている

### 出力形式
- **最重要**: 改善後の記事本文のみを出力してください
- **絶対に、出力を\`\`\`text ... \`\`\`のようなコードブロックで囲まないでください**
- 指示に関するコメントや、前置き・後書きは一切含めないでください
- 元の記事の意味と内容を変えず、構造と表現のみを改善してください

記事の改善を開始してください：
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
あなたはプロのSEO専門家です。
以下のブログ記事のタイトルと内容を分析し、記事の主要なテーマを表す関連性の高いタグを3〜7個生成してください。

### Markdown記法について
記事内容には以下のMarkdown記法が含まれている可能性があります：
- コードブロック（\`\`\`言語名）からはプログラミング言語やフレームワーク名を抽出
- 見出し（#, ##, ###）から主要なトピックを特定
- リンク（[テキスト](URL)）から関連技術や参照先を判断
- YouTube埋め込み（{{youtube:ID}}）: 動画コンテンツ、チュートリアル要素を示唆

### タグ生成の条件
- 各タグは簡潔で、単一の単語または短いフレーズ（2-3語以内）
- 記事の内容に直接関連し、記事の価値を的確に表現
- SEOに役立つ検索キーワードとして機能
- 技術記事の場合：使用技術、フレームワーク、言語名を含める
- チュートリアル記事の場合：「初心者向け」「入門」「解説」等を含める
- 重複するタグや類似したタグは避ける
- 日本語または英語（技術用語）で記述

### タグの優先順位
1. **主要技術・ツール名**（例：React, Next.js, Python, Docker）
2. **記事の種類**（例：チュートリアル, 解説, レビュー, ガイド）
3. **対象レベル**（例：初心者向け, 上級者向け, 入門）
4. **応用領域**（例：Web開発, データ分析, ゲーム開発）
5. **特定の手法・概念**（例：認証, API設計, パフォーマンス最適化）

### 出力形式
- 生成されたタグのみをカンマ区切りで出力してください
- 他のテキスト、説明、コメント、前置き、箇条書き、引用符などは一切含めないでください
- タグの前後にスペースは入れず、カンマの直後にのみスペースを入れてください

### 例
**記事タイトル:** Next.jsとSupabaseでブログを構築する完全ガイド
**記事内容:** この記事では、Next.jsのApp RouterとSupabaseを組み合わせて...
**出力:** Next.js, Supabase, Web開発, ブログ構築, 認証, データベース

---

**記事タイトル:** ${title}

**記事内容:**
${content}

**出力:**`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    const tags = text
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && tag.length <= 30)
      .slice(0, 7);

    return { tags, error: null };
  } catch (error) {
    console.error("Error generating tags:", error);
    return { 
      tags: null, 
      error: "タグの自動生成中にエラーが発生しました。時間をおいて再度お試しください。" 
    };
  }
};

export const generateTitleSuggestions = async (content: string): Promise<{ titles: string[] | null; error: string | null }> => {
  const model = getGeminiModel();

  const prompt = `
あなたは、読者の目を引く魅力的な記事タイトルを考えるプロのコピーライターです。
以下の記事の内容を分析し、内容を的確に表しつつ、クリックしたくなるようなタイトルを5つ提案してください。

### 指示
- タイトルは30〜50文字程度で、具体的かつ魅力的なものにしてください
- ターゲット読者が興味を持ちそうなキーワードを含めてください
- 異なる切り口（例：ハウツー、疑問解決、驚きの事実、包括的ガイドなど）で提案してください
- 日本語で記述してください

### 記事の内容
${content.substring(0, 3000)}

### 出力形式
- タイトルのみを改行区切りで5つ出力してください
- 番号や記号、説明、前置きなどは一切含めないでください
- 1行に1つのタイトルのみを記述してください

### タイトル案
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    const titles = text
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .slice(0, 5);

    return { titles, error: null };
  } catch (error) {
    console.error("Error generating titles:", error);
    return { 
      titles: null, 
      error: "タイトルの提案中にエラーが発生しました。" 
    };
  }
};

export const generateSummaryFromContent = async (title: string, content: string): Promise<{ summary: string | null; error: string | null }> => {
  const model = getGeminiModel();

  const plainContent = content
    .replace(/---/g, ' ')
    .replace(/#{1,6}\s/g, ' ')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/~~/g, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\|/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const prompt = `
あなたは、読者の興味を引くのが得意なプロの編集者です。
以下のブログ記事のタイトルと内容を読み、記事の核心を突いた、簡潔で魅力的な要約を生成してください。

### 指示
- 要約は日本語で、およそ150文字程度にまとめてください
- 記事全体を読みたくなるような、キャッチーな文章を意識してください
- 記事の重要なキーワードをいくつか含めてください
- 生成するのは要約の文章のみです。タイトルや前置き、記号などは一切含めないでください

### 記事のタイトル
${title}

### 記事の内容
${plainContent.substring(0, 3000)}

### 出力形式
要約の文章（150文字程度）

### 要約
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text().trim();

    return { summary, error: null };
  } catch (error) {
    console.error("Error generating summary:", error);
    return { 
      summary: null, 
      error: "AIによる要約の生成中にエラーが発生しました。" 
    };
  }
};