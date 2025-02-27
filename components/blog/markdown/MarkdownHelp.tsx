import React, { useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const MarkdownHelp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  const markdownExamples = [
    { syntax: "# 見出し1", description: "最大の見出し" },
    { syntax: "## 見出し2", description: "2番目に大きい見出し" },
    { syntax: "**太字**", description: "太字テキスト" },
    { syntax: "*斜体*", description: "斜体テキスト" },
    { syntax: "- リスト項目", description: "箇条書きリスト" },
    { syntax: "1. 番号付きリスト", description: "番号付きリスト" },
    { syntax: "[リンク](https://example.com)", description: "ハイパーリンク" },
    { syntax: "![代替テキスト](https://example.com/image.jpg)", description: "画像" },
    { syntax: "```python\nprint('コードブロック')\n```", description: "コードブロック" },
    { syntax: "> 引用", description: "引用文" },
    { syntax: "---", description: "水平線" },
  ]

  const youtubeExamples = [
    { 
      syntax: "{{youtube:VIDEO_ID}}", 
      description: "基本的なYouTube埋め込み" 
    },
    { 
      syntax: "{{youtube:VIDEO_ID:showDetails=false}}", 
      description: "詳細情報なしで埋め込み" 
    },
  ]

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          className="flex items-center space-x-2"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Markdownヘルプ</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4">
        <Tabs defaultValue="basic">
          <TabsList className="mb-4">
            <TabsTrigger value="basic">基本構文</TabsTrigger>
            <TabsTrigger value="youtube">YouTube埋め込み</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            <h3 className="text-lg font-semibold mb-4">Markdownの使い方</h3>
            <div className="space-y-2">
              {markdownExamples.map((example, index) => (
                <div key={index} className="flex justify-between border-b pb-2 last:border-b-0">
                  <code className="bg-gray-100 p-1 rounded text-sm mr-2">
                    {example.syntax}
                  </code>
                  <span className="text-muted-foreground">{example.description}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="youtube">
            <h3 className="text-lg font-semibold mb-4">YouTube埋め込み構文</h3>
            <div className="space-y-2 mb-4">
              {youtubeExamples.map((example, index) => (
                <div key={index} className="flex justify-between border-b pb-2 last:border-b-0">
                  <code className="bg-gray-100 p-1 rounded text-sm mr-2">
                    {example.syntax}
                  </code>
                  <span className="text-muted-foreground">{example.description}</span>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 p-3 rounded border border-amber-200 text-sm">
              <p className="font-semibold text-amber-800 mb-1">使用例:</p>
              <code className="block bg-white p-2 rounded border border-amber-100 mb-2">
                {'{{youtube:dQw4w9WgXcQ}}'}
              </code>
              <p className="text-amber-700">
                VIDEO_IDはYouTube URLの「v=」パラメータ後の部分です。<br />
                例: youtu.be/<strong>dQw4w9WgXcQ</strong> または<br />
                youtube.com/watch?v=<strong>dQw4w9WgXcQ</strong>
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

export default MarkdownHelp