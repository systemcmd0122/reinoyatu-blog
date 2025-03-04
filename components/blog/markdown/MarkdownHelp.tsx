import React, { useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { HelpCircle, Code, Youtube } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CodeLanguageSelector, { CodeLanguage } from "./CodeLanguageSelector"

interface MarkdownHelpProps {
  onInsertCodeBlock?: (language: string) => void
}

const MarkdownHelp: React.FC<MarkdownHelpProps> = ({ onInsertCodeBlock }) => {
  const [isOpen, setIsOpen] = useState(false)

  // マークダウン例の改善：より整理されたデザイン
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

  // YouTube埋め込み例の更新（IDのみをサポート）
  const youtubeExamples = [
    { 
      syntax: "{{youtube:VIDEO_ID}}", 
      description: "基本的な埋め込み" 
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
          className="flex items-center space-x-2 hover:bg-gray-100 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Markdownヘルプ</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 shadow-lg border-gray-200">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-gray-50 rounded-t-lg p-1">
            <TabsTrigger value="basic" className="py-2">基本構文</TabsTrigger>
            <TabsTrigger value="code" className="py-2">コード</TabsTrigger>
            <TabsTrigger value="youtube" className="py-2">YouTube</TabsTrigger>
          </TabsList>
          
          <div className="p-4">
            <TabsContent value="basic">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Markdownの使い方</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {markdownExamples.map((example, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                    <code className="block w-full bg-white border border-gray-200 p-1.5 rounded text-sm font-mono mb-2 shadow-sm">
                      {example.syntax}
                    </code>
                    <span className="text-gray-600 text-sm block">{example.description}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="code">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">コードブロック</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  コードブロックは3つのバッククォート（```）で囲み、最初の行に言語名を指定します：
                </p>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-4">
                  <pre className="text-sm font-mono">```python<br/>print(&quot;Hello, World!&quot;)<br/>```</pre>
                </div>
              </div>
              
              {onInsertCodeBlock && (
                <div className="mb-5 p-3 bg-blue-50 rounded-md border border-blue-100">
                  <h4 className="font-medium mb-2 text-blue-800">コードブロックを挿入</h4>
                  <div className="flex gap-2">
                    <CodeLanguageSelector 
                      languages={codeLanguages} 
                      onSelect={handleLanguageSelect} 
                    />
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => handleLanguageSelect("text")}
                      className="flex items-center"
                    >
                      <Code className="w-4 h-4 mr-1" />
                      挿入
                    </Button>
                  </div>
                </div>
              )}
              
              <h4 className="font-medium mb-2 text-gray-700">サポートされている言語</h4>
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-md border border-gray-200">
                {codeLanguages.map((lang, index) => (
                  <div key={index} className="text-sm flex items-center">
                    <code className="bg-white px-1.5 py-0.5 rounded text-xs border border-gray-200 mr-1.5 font-mono">{lang.name}</code>
                    <span className="text-gray-600">{lang.description}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="youtube">
              <div className="flex items-center mb-4">
                <Youtube className="w-5 h-5 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">YouTube埋め込み</h3>
              </div>
              
              <div className="space-y-4">
                {youtubeExamples.map((example, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                    <code className="block w-full bg-white border border-gray-200 p-2 rounded text-sm font-mono mb-2 shadow-sm">
                      {example.syntax}
                    </code>
                    <span className="text-gray-700 text-sm block">{example.description}</span>
                  </div>
                ))}
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-sm mt-4">
                <p className="font-semibold text-yellow-800 mb-2">使用方法の詳細：</p>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-700 mb-1">ビデオIDの見つけ方：</p>
                    <p className="text-gray-600">
                      ビデオIDはYouTubeのURLの「v=」パラメータ後の部分、または短縮URLの最後の部分です。<br/>
                      例: https://www.youtube.com/watch?v=<span className="font-bold">dQw4w9WgXcQ</span>
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-700 mb-1">オプション設定:</p>
                    <p className="text-gray-600">
                      <code className="bg-white p-1 rounded border border-yellow-100 text-xs">showDetails=false</code> - 
                      ビデオのタイトルと説明を非表示にします
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-700 mb-1">埋め込み例:</p>
                    <code className="bg-white p-1 rounded border border-yellow-100 text-xs block">
                    <p>&#123;&#123;youtube:dQw4w9WgXcQ&#125;&#125;</p>
                    </code>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

export default MarkdownHelp