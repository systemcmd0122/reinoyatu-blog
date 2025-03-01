import React, { useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { HelpCircle, Code } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CodeLanguageSelector, { CodeLanguage } from "./CodeLanguageSelector"

interface MarkdownHelpProps {
  onInsertCodeBlock?: (language: string) => void
}

const MarkdownHelp: React.FC<MarkdownHelpProps> = ({ onInsertCodeBlock }) => {
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
    { syntax: "```言語名\nコードブロック\n```", description: "コードブロック" },
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

  // プログラミング言語の例
  const codeLanguages: CodeLanguage[] = [
    { name: "javascript", description: "JavaScript" },
    { name: "typescript", description: "TypeScript" },
    { name: "jsx", description: "React JSX" },
    { name: "tsx", description: "React TSX" },
    { name: "html", description: "HTML" },
    { name: "css", description: "CSS" },
    { name: "python", description: "Python" },
    { name: "java", description: "Java" },
    { name: "csharp", description: "C#" },
    { name: "cpp", description: "C++" },
  ]

  const handleLanguageSelect = (language: string) => {
    if (onInsertCodeBlock) {
      onInsertCodeBlock(language)
      setIsOpen(false)
    }
  }

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
            <TabsTrigger value="code">コード</TabsTrigger>
            <TabsTrigger value="youtube">YouTube</TabsTrigger>
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
          
          <TabsContent value="code">
            <h3 className="text-lg font-semibold mb-4">コードブロックと言語</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                コードブロックは3つのバッククォート（```）で囲み、最初の行に言語名を指定します：
              </p>
              <div className="bg-gray-100 p-3 rounded mb-4">
                <pre className="text-sm">```python<br/>print("Hello, World!")<br/>```</pre>
              </div>
            </div>
            
            {onInsertCodeBlock && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">コードブロックを挿入</h4>
                <div className="flex gap-2">
                  <CodeLanguageSelector 
                    languages={codeLanguages} 
                    onSelect={handleLanguageSelect} 
                  />
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => handleLanguageSelect("text")}
                  >
                    <Code className="w-4 h-4 mr-1" />
                    挿入
                  </Button>
                </div>
              </div>
            )}
            
            <h4 className="font-medium mb-2">サポートされている言語（一部）</h4>
            <div className="grid grid-cols-2 gap-2">
              {codeLanguages.map((lang, index) => (
                <div key={index} className="text-sm">
                  <code className="bg-gray-100 px-1 rounded">{lang.name}</code>
                  <span className="text-gray-600 ml-1">{lang.description}</span>
                </div>
              ))}
            </div>
            
            <div className="bg-amber-50 p-3 rounded border border-amber-200 text-sm mt-4">
              <p className="font-semibold text-amber-800 mb-1">使用例:</p>
              <pre className="bg-white p-2 rounded border border-amber-100 mb-2">
{`\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\``}
              </pre>
              <p className="text-amber-700">
                言語を選択すると、構文ハイライトが適用されます。<br />
                言語選択メニューからいつでも言語を変更できます。
              </p>
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