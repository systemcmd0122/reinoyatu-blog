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
          className="flex items-center space-x-2 hover:bg-muted"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Markdownヘルプ</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0 shadow-lg bg-card text-card-foreground">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-muted rounded-t-lg p-1">
            <TabsTrigger value="basic" className="py-2 text-sm">基本構文</TabsTrigger>
            <TabsTrigger value="code" className="py-2 text-sm">コード</TabsTrigger>
            <TabsTrigger value="youtube" className="py-2 text-sm">YouTube</TabsTrigger>
          </TabsList>
          
          <div className="p-4">
            <TabsContent value="basic">
              <h3 className="text-lg font-semibold mb-4">Markdownの使い方</h3>
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                {markdownExamples.map((example, index) => (
                  <div key={index} className="p-3 bg-muted rounded-md hover:bg-accent transition-colors">
                    <code className="block w-full bg-background border border-border p-2 rounded text-sm font-mono mb-2 whitespace-pre-wrap text-foreground">
                      {example.syntax}
                    </code>
                    <span className="text-muted-foreground text-sm">{example.description}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="code">
              <h3 className="text-lg font-semibold mb-4">コードブロック</h3>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  コードブロックは3つのバッククォート(```)で囲み、最初の行に言語名を指定します:
                </p>
                <div className="bg-muted p-3 rounded-md border border-border mb-4">
                  <pre className="text-sm font-mono">```python{'\n'}print(&quot;Hello, World!&quot;){'\n'}```</pre>
                </div>
              </div>
              
              {onInsertCodeBlock && (
                <div className="mb-5 p-3 bg-primary/10 rounded-md border border-primary/20">
                  <h4 className="font-medium mb-2 text-primary">コードブロックを挿入</h4>
                  <p className="text-sm text-muted-foreground mb-3">
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
              <div className="grid grid-cols-2 gap-2 bg-muted p-3 rounded-md max-h-64 overflow-y-auto">
                {codeLanguages.map((lang, index) => (
                  <div key={index} className="text-sm flex items-center">
                    <code className="bg-background px-1.5 py-0.5 rounded text-xs border border-border mr-1.5 font-mono text-foreground">
                      {lang.name}
                    </code>
                    <span className="text-muted-foreground truncate">{lang.description}</span>
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
                  <div key={index} className="p-3 bg-muted rounded-md hover:bg-accent transition-colors">
                    <code className="block w-full bg-background border border-border p-2 rounded text-sm font-mono mb-2 text-foreground">
                      {example.syntax}
                    </code>
                    <span className="text-muted-foreground text-sm">{example.description}</span>
                  </div>
                ))}
              </div>
              
              <div className="bg-yellow-500/10 p-4 rounded-md border border-yellow-500/20 text-sm mt-4">
                <p className="font-semibold text-yellow-600 dark:text-yellow-500 mb-2">使用方法の詳細:</p>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-foreground/80 mb-1">ビデオIDの見つけ方:</p>
                    <p className="text-muted-foreground mb-2">
                      ビデオIDはYouTubeのURLの「v=」パラメータ後の部分、または短縮URLの最後の部分です。
                    </p>
                    <div className="bg-background p-2 rounded border border-border">
                      <p className="text-xs text-muted-foreground mb-1">例1: 通常URL</p>
                      <code className="text-xs text-foreground">
                        https://www.youtube.com/watch?v=<span className="font-bold text-red-600">dQw4w9WgXcQ</span>
                      </code>
                      <p className="text-xs text-muted-foreground mb-1 mt-2">例2: 短縮URL</p>
                      <code className="text-xs text-foreground">
                        https://youtu.be/<span className="font-bold text-red-600">dQw4w9WgXcQ</span>
                      </code>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium text-foreground/80 mb-1">オプション設定:</p>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• デフォルトで詳細情報が表示されます</li>
                      <li>• <code className="bg-background px-1 py-0.5 rounded text-xs border border-border">showDetails=false</code> で詳細情報を非表示</li>
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