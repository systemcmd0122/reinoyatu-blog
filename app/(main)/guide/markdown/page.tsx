"use client"

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import MarkdownPlayground from "@/components/guide/MarkdownPlayground"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const MarkdownRenderer = dynamic(
  () => import("@/components/blog/markdown/MarkdownRenderer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
  }
)

const MarkdownGuidePage = () => {
  const [selectedTab, setSelectedTab] = useState("basic")

  const basicGuide = `
# マークダウンの基本
マークダウンは、簡単に文書を書くための軽量マークアップ言語です。

## 見出し
見出しは \`#\` を使って表現します。
# 見出し1
## 見出し2
### 見出し3
#### 見出し4
##### 見出し5
###### 見出し6

## テキストの装飾
- **太字** は \`**テキスト**\` または \`__テキスト__\`
- *斜体* は \`*テキスト*\` または \`_テキスト_\`
- ~~取り消し線~~ は \`~~テキスト~~\`
- \`インラインコード\` は \`\`バッククォート\`\`

## リスト
### 箇条書きリスト
- リスト1
- リスト2
  - ネストされたリスト
  - さらにネスト
- リスト3

### 番号付きリスト
1. 最初の項目
2. 2番目の項目
   1. ネストされた項目
   2. もう一つ
3. 3番目の項目

### タスクリスト
- [x] 完了したタスク
- [ ] 未完了のタスク
- [x] もう一つ完了したタスク

## 引用
> これは引用文です。
> 複数行にまたがることもできます。
>> ネストされた引用も可能です。

## リンクと画像
[リンクのテキスト](https://example.com)
![画像の代替テキスト](/og-image.png)

## コードブロック
\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

## 表
| 列1 | 列2 | 列3 |
|-----|:---:|----:|
| 左揃え | 中央揃え | 右揃え |
| データ1 | データ2 | データ3 |
`

  const advancedGuide = `
# 高度なマークダウン機能

## 数式
インライン数式: $E = mc^2$

ブロック数式:
$$
\\frac{n!}{k!(n-k)!} = \\binom{n}{k}
$$

## 脚注
これは脚注付きのテキスト[^1]です。別の脚注[^2]も使えます。

[^1]: 脚注の内容をここに書きます。
[^2]: 複数行の脚注も可能です。
    インデントして追加の行を書きます。

## コールアウト（注意書き）
:::info
これは情報ボックスです。
重要な情報を強調するのに使います。
:::

:::warning
これは警告ボックスです。
注意事項を書くのに適しています。
:::

:::success
これは成功メッセージです。
正常に完了したことを示すのに使います。
:::

## YouTubeの埋め込み
{{youtube:dQw4w9WgXcQ}}

## タイムライン
--timeline-1--

## アコーディオン
--accordion-1--

## プログレスバー
--progress-1--
`

  const exampleGuide = `
# マークダウンの使用例

## ブログ記事の例
# 私のプログラミング学習記録

今日は **Next.js** と **TypeScript** について学習した内容を共有します。

## 学んだこと
1. Reactコンポーネントの基本
2. TypeScriptの型システム
3. Next.jsのルーティング

### コードの例
\`\`\`typescript
interface Props {
  title: string;
  content: string;
}

const BlogPost: React.FC<Props> = ({ title, content }) => {
  return (
    <article>
      <h1>{title}</h1>
      <p>{content}</p>
    </article>
  );
};
\`\`\`

## 技術メモの例
:::info
重要な概念や注意点をこのように強調できます。
:::

### チェックリスト
- [x] 基本文法の学習
- [x] サンプルコードの実装
- [ ] プロジェクトへの適用
- [ ] ドキュメントの作成

## 数式を使用した例
物理学の基本方程式:

$$
F = ma
$$

エネルギーと質量の関係:

$E = mc^2$

## 図表の活用
| 機能 | 基本 | Pro |
|------|:----:|----:|
| 投稿数 | 10 | 無制限 |
| ストレージ | 5GB | 100GB |
| API利用 | ✕ | ○ |

![機能の比較図](/og-image.png)

## まとめ
このように、マークダウンを使用することで:
- 構造化された文書を簡単に作成できる
- コードや数式を美しく表示できる
- 読みやすい文書を効率的に作成できる

> 継続的な学習と実践が大切です。
> 毎日少しずつでも進めていきましょう。
`

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">マークダウンガイド</h1>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="basic">基本ガイド</TabsTrigger>
          <TabsTrigger value="advanced">高度な機能</TabsTrigger>
          <TabsTrigger value="example">使用例</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>マークダウンの基本</CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownRenderer content={basicGuide} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>高度なマークダウン機能</CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownRenderer 
                content={advancedGuide}
                enableMath={true}
                enableRaw={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="example">
          <Card>
            <CardHeader>
              <CardTitle>マークダウンの使用例</CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownRenderer 
                content={exampleGuide}
                enableMath={true}
                enableRaw={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator className="my-8" />

      <section className="mt-8">
        <h2 className="text-3xl font-bold mb-4">マークダウンを試してみる</h2>
        <p className="text-gray-600 mb-4">
          以下のエディターでマークダウンを自由に試すことができます。
          入力した内容はリアルタイムでプレビューされます。
        </p>
        <MarkdownPlayground />
      </section>
    </div>
  )
}

export default MarkdownGuidePage