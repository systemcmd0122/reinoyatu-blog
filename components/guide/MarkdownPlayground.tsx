"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import dynamic from "next/dynamic"

const MarkdownRenderer = dynamic(
  () => import("@/components/blog/markdown/MarkdownRenderer"),
  { ssr: false }
)

const MarkdownPlayground = () => {
  const [markdown, setMarkdown] = useState(`# マークダウンを試してみましょう

ここに**マークダウン**を入力すると、右側に*プレビュー*が表示されます。

## 使用可能な機能
- 基本的なマークダウン記法
- 数式: $E = mc^2$
- コードブロック
- 表
- その他の拡張機能

\`\`\`javascript
console.log("Hello, Markdown!");
\`\`\`

| 機能 | サポート状況 |
|------|------------|
| 基本記法 | ○ |
| 数式 | ○ |
| 表 | ○ |
`)

  return (
    <Card className="p-4">
      <Tabs defaultValue="edit">
        <TabsList>
          <TabsTrigger value="edit">編集</TabsTrigger>
          <TabsTrigger value="preview">プレビュー</TabsTrigger>
          <TabsTrigger value="split">分割表示</TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <Textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="min-h-[500px] font-mono"
            placeholder="マークダウンを入力..."
          />
        </TabsContent>

        <TabsContent value="preview">
          <div className="prose max-w-none">
            <MarkdownRenderer 
              content={markdown}
              enableMath={true}
              enableRaw={true}
            />
          </div>
        </TabsContent>

        <TabsContent value="split">
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="min-h-[500px] font-mono"
              placeholder="マークダウンを入力..."
            />
            <div className="prose max-w-none border rounded-md p-4">
              <MarkdownRenderer 
                content={markdown}
                enableMath={true}
                enableRaw={true}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}

export default MarkdownPlayground