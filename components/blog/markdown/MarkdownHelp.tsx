import React, { useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { HelpCircle, Youtube } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MarkdownHelpProps {
  onInsertCodeBlock?: (language: string) => void
}

interface CodeLanguage {
  name: string
  description: string
}

const MarkdownHelp: React.FC<MarkdownHelpProps> = ({ onInsertCodeBlock }) => {
  const [isOpen, setIsOpen] = useState(false)

  // 基本的なMarkdown構文の例
  const markdownExamples = [
    // 見出し
    { syntax: "# 見出し1", description: "最大の見出し" },
    { syntax: "## 見出し2", description: "2番目に大きい見出し" },
    { syntax: "### 見出し3", description: "3番目に大きい見出し" },
    
    // テキスト装飾
    { syntax: "**太字**", description: "太字テキスト" },
    { syntax: "*斜体*", description: "斜体テキスト" },
    { syntax: "~~取り消し線~~", description: "取り消し線テキスト" },
    
    // リスト
    { syntax: "- リスト項目", description: "箇条書きリスト" },
    { syntax: "1. 番号付きリスト", description: "番号付きリスト" },
    { syntax: "- [ ] タスク", description: "タスク(未完了)" },
    { syntax: "- [x] タスク", description: "タスク(完了)" },
    
    // 引用とリンク
    { syntax: "> 引用文", description: "引用" },
    { syntax: "[リンク](URL)", description: "ハイパーリンク" },
    { syntax: "![代替テキスト](画像URL)", description: "画像" },
    
    // 水平線
    { syntax: "---", description: "水平線" },
    
    // テーブル
    { 
      syntax: "| 列1 | 列2 |\n|-----|-----|\n| A | B |", 
      description: "テーブル" 
    },
    
    // コードブロック
    { 
      syntax: "```javascript\nconst x = 1;\n```", 
      description: "シンタックスハイライト付きコード" 
    },
  ]

  // YouTube埋め込み例
  const youtubeExamples = [
    { 
      syntax: "{{youtube:VIDEO_ID}}", 
      description: "基本的な埋め込み（詳細情報あり）" 
    },
    { 
      syntax: "{{youtube:VIDEO_ID:showDetails=false}}", 
      description: "詳細情報なしで埋め込み" 
    },
    { 
      syntax: "{{youtube:dQw4w9WgXcQ}}", 
      description: "実際の例" 
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
    { name: "c", description: "C" },
    { name: "php", description: "PHP" },
    { name: "ruby", description: "Ruby" },
    { name: "go", description: "Go" },
    { name: "rust", description: "Rust" },
    { name: "sql", description: "SQL" },
    { name: "json", description: "JSON" },
    { name: "yaml", description: "YAML" },
    { name: "bash", description: "Bash/Shell" },
    { name: "markdown", description: "Markdown" },
    { name: "text", description: "プレーンテキスト" },
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
          className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Markdownヘルプ</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0 shadow-lg">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-gray-50 dark:bg-gray-800 rounded-t-lg p-1">
            <TabsTrigger value="basic" className="py-2 text-sm">基本構文</TabsTrigger>
            <TabsTrigger value="code" className="py-2 text-sm">コード</TabsTrigger>
            <TabsTrigger value="youtube" className="py-2 text-sm">YouTube</TabsTrigger>
          </TabsList>
          
          <div className="p-4">
            <TabsContent value="basic">
              <h3 className="text-lg font-semibold mb-4">Markdownの使い方</h3>
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                {markdownExamples.map((example, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                    <code className="block w-full bg-white dark:bg-gray-900 border p-2 rounded text-sm font-mono mb-2 whitespace-pre-wrap">
                      {example.syntax}
                    </code>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">{example.description}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="code">
              <h3 className="text-lg font-semibold mb-4">コードブロック</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  コードブロックは3つのバッククォート(```)で囲み、最初の行に言語名を指定します:
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md border mb-4">
                  <pre className="text-sm font-mono">```python{'\n'}print(&quot;Hello, World!&quot;){'\n'}```</pre>
                </div>
              </div>
              
              {onInsertCodeBlock && (
                <div className="mb-5 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-300">コードブロックを挿入</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    言語を選択してコードブロックのテンプレートを挿入できます
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {codeLanguages.slice(0, 8).map((lang) => (
                      <Button
                        key={lang.name}
                        size="sm"
                        variant="outline"
                        onClick={() => handleLanguageSelect(lang.name)}
                        className="text-xs"
                      >
                        {lang.description}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <h4 className="font-medium mb-2">サポートされている言語</h4>
              <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-md max-h-64 overflow-y-auto">
                {codeLanguages.map((lang, index) => (
                  <div key={index} className="text-sm flex items-center">
                    <code className="bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded text-xs border mr-1.5 font-mono">
                      {lang.name}
                    </code>
                    <span className="text-gray-600 dark:text-gray-400 truncate">{lang.description}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="youtube">
              <div className="flex items-center mb-4">
                <Youtube className="w-5 h-5 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold">YouTube埋め込み</h3>
              </div>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {youtubeExamples.map((example, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                    <code className="block w-full bg-white dark:bg-gray-900 border p-2 rounded text-sm font-mono mb-2">
                      {example.syntax}
                    </code>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{example.description}</span>
                  </div>
                ))}
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-md border border-yellow-200 dark:border-yellow-800 text-sm mt-4">
                <p className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">使用方法の詳細:</p>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">ビデオIDの見つけ方:</p>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      ビデオIDはYouTubeのURLの「v=」パラメータ後の部分、または短縮URLの最後の部分です。
                    </p>
                    <div className="bg-white dark:bg-gray-900 p-2 rounded border">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">例1: 通常URL</p>
                      <code className="text-xs">
                        https://www.youtube.com/watch?v=<span className="font-bold text-red-600">dQw4w9WgXcQ</span>
                      </code>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 mt-2">例2: 短縮URL</p>
                      <code className="text-xs">
                        https://youtu.be/<span className="font-bold text-red-600">dQw4w9WgXcQ</span>
                      </code>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">オプション設定:</p>
                    <ul className="text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                      <li>• デフォルトで詳細情報が表示されます</li>
                      <li>• <code className="bg-white dark:bg-gray-900 px-1 py-0.5 rounded text-xs">showDetails=false</code> で詳細情報を非表示</li>
                    </ul>
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