"use client"

import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, Download, Trash2 } from "lucide-react"
import dynamic from "next/dynamic"
import { toast } from "sonner"

const MarkdownRenderer = dynamic(
  () => import("@/components/blog/markdown/MarkdownRenderer"),
  { 
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4 p-4">
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    )
  }
)

const MarkdownPlayground = () => {
  const [markdown, setMarkdown] = useState(`# Markdownプレイグラウンド

ここに**Markdown**を入力すると、リアルタイムで*プレビュー*が表示されます。

## 基本的なテキスト装飾

**太字のテキスト**と*斜体のテキスト*、そして~~取り消し線~~も使えます。

\`インラインコード\`も表示できます。

## リスト

### 箇条書きリスト
- 項目1
- 項目2
  - サブ項目2.1
  - サブ項目2.2
- 項目3

### 番号付きリスト
1. 最初の項目
2. 2番目の項目
3. 3番目の項目

### タスクリスト
- [x] 完了したタスク
- [ ] 未完了のタスク
- [ ] もう一つのタスク

## コードブロック

JavaScriptのコード例：

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);

function add(a, b) {
  return a + b;
}
\`\`\`

Pythonのコード例：

\`\`\`python
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
\`\`\`

## 引用

> これは引用です。
> 複数行にわたる引用も可能です。
> 
> 新しい段落も作成できます。

## リンクと画像

[リンクの例](https://example.com)

![画像の例](https://via.placeholder.com/400x200)

## テーブル

| 機能 | サポート状況 | 備考 |
|------|------------|------|
| 見出し | ○ | H1-H6 |
| リスト | ○ | 箇条書き・番号付き |
| コード | ○ | シンタックスハイライト |
| テーブル | ○ | 整列対応 |

## 水平線

---

## YouTube埋め込み

YouTube動画を埋め込むこともできます：

{{youtube:dQw4w9WgXcQ}}

詳細情報なしで埋め込む場合：

{{youtube:dQw4w9WgXcQ:showDetails=false}}

---

## ヒント

- 空行を入れることで段落を分けることができます
- コードブロックには言語名を指定するとシンタックスハイライトが適用されます
- テーブルのセルの配置は \`|\` の後の \`:\` の位置で調整できます
`)

  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      toast.success("Markdownをコピーしました")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("コピーに失敗しました")
    }
  }

  const handleDownload = () => {
    try {
      const blob = new Blob([markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `markdown-${Date.now()}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Markdownをダウンロードしました")
    } catch (error) {
      toast.error("ダウンロードに失敗しました")
    }
  }

  const handleClear = () => {
    if (confirm("本当にすべてクリアしますか？")) {
      setMarkdown("")
      toast.success("内容をクリアしました")
    }
  }

  const loadExample = (example: string) => {
    const examples: { [key: string]: string } = {
      basic: `# 基本的な使い方

## テキスト装飾
**太字**、*斜体*、~~取り消し線~~

## リスト
- 項目1
- 項目2
- 項目3`,
      
      code: `# コードブロックの例

JavaScriptコード：

\`\`\`javascript
const message = "Hello, World!";
console.log(message);
\`\`\`

Pythonコード：

\`\`\`python
def hello():
    print("Hello, World!")
\`\`\``,
      
      table: `# テーブルの例

| 名前 | 年齢 | 職業 |
|------|------|------|
| 太郎 | 25 | エンジニア |
| 花子 | 30 | デザイナー |
| 次郎 | 28 | マネージャー |`,
      
      youtube: `# YouTube埋め込みの例

動画プレビュー：

{{youtube:dQw4w9WgXcQ}}

詳細なしで埋め込み：

{{youtube:dQw4w9WgXcQ:showDetails=false}}`
    }
    
    setMarkdown(examples[example] || "")
    toast.success("サンプルを読み込みました")
  }

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Markdownプレイグラウンド</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Markdownをリアルタイムでプレビューできます
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {markdown.length}文字
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex items-center space-x-1"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span className="hidden sm:inline">コピー済み</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span className="hidden sm:inline">コピー</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">ダウンロード</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">クリア</span>
              </Button>
            </div>
          </div>
          
          {/* サンプル読み込みボタン */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-sm text-muted-foreground">サンプル:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadExample('basic')}
              className="text-xs"
            >
              基本
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadExample('code')}
              className="text-xs"
            >
              コード
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadExample('table')}
              className="text-xs"
            >
              テーブル
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadExample('youtube')}
              className="text-xs"
            >
              YouTube
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="split" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="edit">編集のみ</TabsTrigger>
              <TabsTrigger value="split">分割表示</TabsTrigger>
              <TabsTrigger value="preview">プレビューのみ</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4">
              <Textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="min-h-[600px] font-mono text-sm leading-relaxed"
                placeholder="ここにMarkdownを入力してください..."
              />
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="prose prose-sm max-w-none border rounded-lg p-6 min-h-[600px] bg-white dark:bg-gray-900">
                {markdown ? (
                  <MarkdownRenderer content={markdown} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>Markdownを入力するとプレビューが表示されます</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="split" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">編集</h3>
                    <Badge variant="secondary" className="text-xs">
                      Markdown
                    </Badge>
                  </div>
                  <Textarea
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    className="min-h-[600px] font-mono text-sm leading-relaxed resize-none"
                    placeholder="ここにMarkdownを入力してください..."
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">プレビュー</h3>
                    <Badge variant="secondary" className="text-xs">
                      レンダリング結果
                    </Badge>
                  </div>
                  <div className="prose prose-sm max-w-none border rounded-lg p-6 min-h-[600px] overflow-y-auto bg-white dark:bg-gray-900">
                    {markdown ? (
                      <MarkdownRenderer content={markdown} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <p>Markdownを入力するとプレビューが表示されます</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default MarkdownPlayground