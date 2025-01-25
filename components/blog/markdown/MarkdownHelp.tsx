import React, { useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"

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
    { syntax: "```python\nprint('コードブロック')\n```", description: "コードブロック" },
    { syntax: "> 引用", description: "引用文" },
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
      </PopoverContent>
    </Popover>
  )
}

export default MarkdownHelp