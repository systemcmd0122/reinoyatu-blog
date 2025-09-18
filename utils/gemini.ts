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

// Markdownの詳細情報を含む包括的な指示
const getMarkdownComprehensiveGuide = (): string => {
  return `
### サポートされているMarkdown記法の完全ガイド

**基本的なテキスト装飾:**
- **太字**: **太字** または __太字__
- *斜体*: *斜体* または _斜体_
- ~~取り消し線~~: ~~取り消し線~~
- ==ハイライト==: ==ハイライト==（一部の環境でサポート）

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
- チェックボックス:
  - 未完了: - [ ] チェックボックス
  - 完了: - [x] チェックボックス

**リンクと画像:**
- リンク: [テキスト](URL)
- 画像: ![代替テキスト](画像URL)
- 参照スタイルリンク: [テキスト][参照ID]

**コードブロック:**
- インラインコード: code（バッククォートで囲む）
- コードブロック:

language名
コードの内容


**サポートされるプログラミング言語:**
javascript, typescript, jsx, tsx, html, css, scss, python, java, csharp, cpp, c, php, ruby, go, rust, kotlin, swift, sql, json, xml, yaml, bash, powershell, dockerfile, markdown, text

**引用:**
> 引用テキスト
> 複数行の引用
> も可能です

**水平線:**
--- または *** または ___

**テーブル:**

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| セル1 | セル2 | セル3 |
| セル4 | セル5 | セル6 |

**改行とエスケープ:**
- 行末に2つのスペースで強制改行
- バックスラッシュ（\\）でMarkdown文字をエスケープ

### 独自拡張機能

**1. スポイラー（ネタバレ防止）:**
- インライン形式: ||隠したいテキスト||
- 行頭形式: /spoiler 隠したいテキスト
- 使用例:
  ||ネタバレを含む内容||
  /spoiler 映画の結末について

**2. 警告・情報ボックス:**
構文: :::タイプ タイトル（任意）
内容
:::

利用可能なタイプ:
- :::info 情報タイトル
情報の内容
:::
- :::warning 警告タイトル
注意事項
:::
- :::error エラータイトル
エラーの説明
:::
- :::success 成功タイトル
成功メッセージ
:::

使用例:
:::warning 重要な注意
この設定を変更する前に、必ずバックアップを取得してください。
:::

:::info 参考情報
詳細については公式ドキュメントを参照してください。
:::

**3. YouTube動画埋め込み:**
基本構文: {{youtube:VIDEO_ID}}

オプション付き:
- {{youtube:VIDEO_ID:showDetails=true}} - 動画の詳細情報を表示（デフォルト）
- {{youtube:VIDEO_ID:showDetails=false}} - 動画の詳細情報を非表示

使用例:

{{youtube:dQw4w9WgXcQ}}
{{youtube:dQw4w9WgXcQ:showDetails=false}}

**VIDEO_IDの取得方法:**
- 通常のURL: https://www.youtube.com/watch?v=**dQw4w9WgXcQ**
- 短縮URL: https://youtu.be/**dQw4w9WgXcQ**

### 重要な注意事項

1. **構文の正確性**: すべての開始タグには対応する終了タグが必要
2. **改行の重要性**: ブロック要素（見出し、リスト、コードブロック等）の前後には空行を入れる
3. **文字エンコーディング**: UTF-8を想定
4. **特殊文字**: Markdownの予約文字を使用する場合はバックスラッシュでエスケープ
5. **YouTube埋め込み**: 新しい行に単独で配置する必要がある
6. **警告ボックス**: 開始と終了の:::は必ず行の先頭から記述する

### スタイリングのベストプラクティス

1. **見出しの階層**: h1 → h2 → h3 の順序を守る
2. **リストの統一**: 同一レベルでは同じマーカー（-,*,+）を使用
3. **コードの言語指定**: 可能な限りシンタックスハイライト用の言語を指定
4. **画像の代替テキスト**: 必ず alt属性に相当する説明を記述
5. **リンクの説明**: リンクテキストは内容を表す分かりやすい文言を使用

この記法を正確に使用して、読みやすく構造化された文書を作成してください。
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

  // 組み立てられたプロンプト
  const styleInstructions = styles.map(s => styleInstructionMap[s]).filter(Boolean);

  const prompt = `
あなたはプロのブログ記事編集者であり、Markdown記法のエキスパートです。以下の指示に基づき、与えられたブログ記事を最高の品質に改善してください。

${getMarkdownComprehensiveGuide()}

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
- ${keepStructure ? "元の見出し、リスト、段落構造を可能な限り維持してください。ただし、Markdown記法をより適切に使用して構造を明確化してください。" : "より論理的で読みやすいように、文章構造を再構成してください。適切な見出し階層を設定し、情報を整理してください。"}
- ${preserveLinks ? "記事内のすべてのハイパーリンクは、正しいMarkdown記法 [テキスト](URL) を使用して、URLとアンカーテキストを含めて完全に保持してください。" : "リンクは不要であれば削除しても構いません。"}
- ${enhanceReadability ? "読者が内容を理解しやすいように、適切な見出し（h2, h3等）、リスト、段落分けを行ってください。長い文章は読みやすい長さに分割してください。" : ""}
- すべてのコードブロックには適切な言語指定を付けてください（例：javascript, python等）
- 必要に応じて、情報ボックス（:::info, :::warning等）やスポイラータグを効果的に使用してください
- YouTube動画がある場合は、{{youtube:VIDEO_ID}}形式で埋め込んでください

${summaryLength ? `
**要約:**
- 記事の冒頭に、内容を要約した文章を${summaryLength === 'short' ? '短い（3文程度）' : summaryLength === 'medium' ? '中程度（5文程度）' : '詳細な（7-10文程度）'}長さで追加してください。
- 要約は通常のパラグラフとして記述するか、必要に応じて:::infoボックスを使用してください。
` : ""}

### 品質チェックリスト
改善後の記事が以下の条件を満たしているか確認してください：

1. **Markdown記法の正確性**
   - すべての見出し（#, ##, ###等）が正しく記述されている
   - リストのマーカー（-, *, +）が統一されている
   - コードブロックの言語指定が適切
   - リンクの記法 [テキスト](URL) が正確
   - 画像の記法 ![alt](URL) が正確

2. **構造の明確性**
   - 見出しの階層が論理的（h1→h2→h3の順序）
   - 段落の分割が適切
   - リストや引用が効果的に使用されている

3. **読みやすさ**
   - 一つの段落が長すぎない（3-5文程度）
   - 専門用語には適切な説明やインラインコードでのマークアップ
   - 重要な情報が見出しや強調（**太字**）で際立っている

4. **独自機能の活用**
   - 注意事項には:::warningボックスを使用
   - 補足情報には:::infoボックスを使用
   - ネタバレ要素には||スポイラータグ||を使用
   - YouTube動画は{{youtube:VIDEO_ID}}で埋め込み

### 出力形式
- 改善後の記事本文のみをMarkdown形式で出力してください
- 指示に関するコメントや、前置き・後書きは一切含めないでください
- 正確なMarkdown記法を使用し、上記のガイドラインに従ってください
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
あなたはプロのSEO専門家であり、コンテンツアナリストです。
以下のブログ記事のタイトルと内容（Markdown記法を含む）を読み込み、記事の主要なテーマ、トピック、キーワードを正確に特定してください。

記事の内容を最もよく表す、関連性の高いタグを3〜7個生成してください。

### Markdown記法について
記事内容にはMarkdown記法が含まれている可能性があります：
- コードブロック（言語名）からはプログラミング言語やフレームワーク名を抽出
- 見出し（#, ##, ###）から主要なトピックを特定
- リンク（[テキスト](URL)）から関連技術や参照先を判断
- 独自記法（:::info, {{youtube:ID}}, ||spoiler||）は考慮対象外

### タグ生成の条件
- 各タグは簡潔で、単一の単語または短いフレーズ（2-3語以内）
- 記事の内容に直接関連し、記事の価値を的確に表現している
- SEOに役立つ検索キーワードとして機能する
- 技術記事の場合：使用技術、フレームワーク、言語名を含める
- チュートリアル記事の場合：「初心者向け」「入門」「解説」等の学習レベルを含める
- 重複するタグや類似したタグは避ける
- 日本語または英語（技術用語）で記述

### タグの優先順位
1. **主要技術・ツール名**（例：React, Next.js, Python）
2. **記事の種類**（例：チュートリアル, 解説, レビュー）
3. **対象レベル**（例：初心者向け, 上級者向け）
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

    // より厳密なタグの抽出とクリーンアップ
    const tags = text
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && tag.length <= 30) // 空文字や異常に長いタグを除外
      .slice(0, 7); // 最大7個に制限

    return { tags, error: null };
  } catch (error) {
    console.error("Error generating tags:", error);
    return { 
      tags: null, 
      error: "タグの自動生成中にエラーが発生しました。時間をおいて再度お試しください。" 
    };
  }
};