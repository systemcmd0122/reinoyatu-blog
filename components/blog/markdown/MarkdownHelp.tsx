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
    { syntax: "### 見出し3", description: "3番目に大きい見出し" },
    { syntax: "#### 見出し4", description: "4番目に大きい見出し" },
    { syntax: "##### 見出し5", description: "5番目に大きい見出し" },
    { syntax: "###### 見出し6", description: "最小の見出し" },
    { syntax: "**太字**", description: "太字テキスト" },
    { syntax: "*斜体*", description: "斜体テキスト" },
    { syntax: "~~取り消し線~~", description: "取り消し線テキスト" },
    { syntax: "==ハイライト==", description: "ハイライトテキスト" },
    { syntax: "- リスト項目", description: "箇条書きリスト" },
    { syntax: "1. 番号付きリスト", description: "番号付きリスト" },
    { syntax: "- [ ] チェックボックス", description: "チェックボックス（未完了）" },
    { syntax: "- [x] チェックボックス", description: "チェックボックス（完了）" },
    { syntax: "[リンク](https://example.com)", description: "ハイパーリンク" },
    { syntax: "![代替テキスト](https://example.com/image.jpg)", description: "画像" },
    { syntax: "```言語名\nコードブロック\n```", description: "コードブロック" },
    { syntax: "> 引用", description: "引用文" },
    { syntax: "---", description: "水平線" },
    { syntax: "| 列1 | 列2 |\n|-----|-----|\n| セル1 | セル2 |", description: "テーブル" },
    { syntax: "||スポイラー||", description: "スポイラーテキスト（クリックで表示）" },
    { syntax: "/spoiler 隠したいテキスト", description: "スポイラーテキスト（行頭）" },
  ]

  // 警告・情報ボックスの例
  const alertExamples = [
    { syntax: ":::info タイトル（任意）\n情報メッセージ\n:::", description: "情報ボックス" },
    { syntax: ":::warning 注意\n警告メッセージ\n:::", description: "警告ボックス" },
    { syntax: ":::error エラー\nエラーメッセージ\n:::", description: "エラーボックス" },
    { syntax: ":::success 成功\n成功メッセージ\n:::", description: "成功ボックス" },
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
    { 
      syntax: "{{youtube:dQw4w9WgXcQ}}", 
      description: "実際の例（Rick Astley - Never Gonna Give You Up）" 
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
    { name: "scss", description: "SCSS/Sass" },
    { name: "python", description: "Python" },
    { name: "java", description: "Java" },
    { name: "csharp", description: "C#" },
    { name: "cpp", description: "C++" },
    { name: "c", description: "C" },
    { name: "php", description: "PHP" },
    { name: "ruby", description: "Ruby" },
    { name: "go", description: "Go" },
    { name: "rust", description: "Rust" },
    { name: "kotlin", description: "Kotlin" },
    { name: "swift", description: "Swift" },
    { name: "sql", description: "SQL" },
    { name: "json", description: "JSON" },
    { name: "xml", description: "XML" },
    { name: "yaml", description: "YAML" },
    { name: "bash", description: "Bash/Shell" },
    { name: "powershell", description: "PowerShell" },
    { name: "dockerfile", description: "Dockerfile" },
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
          className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Markdownヘルプ</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0 shadow-lg border-gray-200 dark:border-gray-700">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-gray-50 dark:bg-gray-800 rounded-t-lg p-1">
            <TabsTrigger value="basic" className="py-2 text-xs">基本構文</TabsTrigger>
            <TabsTrigger value="code" className="py-2 text-xs">コード</TabsTrigger>
            <TabsTrigger value="alert" className="py-2 text-xs">警告・情報</TabsTrigger>
            <TabsTrigger value="youtube" className="py-2 text-xs">YouTube</TabsTrigger>
          </TabsList>
          
          <div className="p-4">
            <TabsContent value="basic">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Markdownの使い方</h3>
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                {markdownExamples.map((example, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <code className="block w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 p-2 rounded text-sm font-mono mb-2 shadow-sm">
                      {example.syntax}
                    </code>
                    <span className="text-gray-600 dark:text-gray-400 text-sm block">{example.description}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="code">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">コードブロック</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  コードブロックは3つのバッククォート（```）で囲み、最初の行に言語名を指定します：
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-600 mb-4">
                  <pre className="text-sm font-mono text-gray-800 dark:text-gray-200">```python<br />print(&quot;Hello, World!&quot;)<br />```</pre>
                </div>
              </div>
              
              {onInsertCodeBlock && (
                <div className="mb-5 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-100 dark:border-blue-800">
                  <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-300">コードブロックを挿入</h4>
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
              
              <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">サポートされている言語</h4>
              <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-600 max-h-64 overflow-y-auto">
                {codeLanguages.map((lang, index) => (
                  <div key={index} className="text-sm flex items-center">
                    <code className="bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded text-xs border border-gray-200 dark:border-gray-600 mr-1.5 font-mono">{lang.name}</code>
                    <span className="text-gray-600 dark:text-gray-400 truncate">{lang.description}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="alert">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">警告・情報ボックス</h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    特別な情報や警告を目立たせるためのボックスを作成できます：
                  </p>
                </div>
                
                {alertExamples.map((example, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <code className="block w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 p-2 rounded text-sm font-mono mb-2 shadow-sm whitespace-pre-wrap">
                      {example.syntax}
                    </code>
                    <span className="text-gray-600 dark:text-gray-400 text-sm block">{example.description}</span>
                  </div>
                ))}
                
                <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-md border border-yellow-200 dark:border-yellow-800 text-sm mt-4">
                  <p className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">使用方法の詳細：</p>
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">利用可能なタイプ：</p>
                      <ul className="text-gray-600 dark:text-gray-400 ml-4 space-y-1">
                        <li>• <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">info</code> - 情報メッセージ</li>
                        <li>• <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">warning</code> - 警告メッセージ</li>
                        <li>• <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">error</code> - エラーメッセージ</li>
                        <li>• <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">success</code> - 成功メッセージ</li>
                      </ul>
                    </div>
                    
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">タイトルについて：</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        タイトルは任意です。省略すると、タイプに応じたデフォルトアイコンのみが表示されます。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="youtube">
              <div className="flex items-center mb-4">
                <Youtube className="w-5 h-5 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">YouTube埋め込み</h3>
              </div>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {youtubeExamples.map((example, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <code className="block w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 p-2 rounded text-sm font-mono mb-2 shadow-sm">
                      {example.syntax}
                    </code>
                    <span className="text-gray-700 dark:text-gray-300 text-sm block">{example.description}</span>
                  </div>
                ))}
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-md border border-yellow-200 dark:border-yellow-800 text-sm mt-4">
                <p className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">使用方法の詳細：</p>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">ビデオIDの見つけ方：</p>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      ビデオIDはYouTubeのURLの「v=」パラメータ後の部分、または短縮URLの最後の部分です。
                    </p>
                    <div className="bg-white dark:bg-gray-900 p-2 rounded border border-yellow-100 dark:border-yellow-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">例1: 通常URL</p>
                      <code className="text-xs">https://www.youtube.com/watch?v=<span className="font-bold text-red-600">dQw4w9WgXcQ</span></code>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 mt-2">例2: 短縮URL</p>
                      <code className="text-xs">https://youtu.be/<span className="font-bold text-red-600">dQw4w9WgXcQ</span></code>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">オプション設定:</p>
                    <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• <code className="bg-white dark:bg-gray-900 p-1 rounded border border-yellow-100 dark:border-yellow-700 text-xs">showDetails=true</code> - ビデオのタイトルと説明を表示（デフォルト）</li>
                      <li>• <code className="bg-white dark:bg-gray-900 p-1 rounded border border-yellow-100 dark:border-yellow-700 text-xs">showDetails=false</code> - ビデオのタイトルと説明を非表示</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">埋め込み例:</p>
                    <div className="bg-white dark:bg-gray-900 p-2 rounded border border-yellow-100 dark:border-yellow-700">
                      <code className="text-xs block mb-1">基本:</code>
                      <code className="text-xs block bg-gray-50 dark:bg-gray-800 p-1 rounded">&#123;&#123;youtube:dQw4w9WgXcQ&#125;&#125;</code>
                      <code className="text-xs block mt-2 mb-1">詳細非表示:</code>
                      <code className="text-xs block bg-gray-50 dark:bg-gray-800 p-1 rounded">&#123;&#123;youtube:dQw4w9WgXcQ:showDetails=false&#125;&#125;</code>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">注意事項:</p>
                    <ul className="text-gray-600 dark:text-gray-400 space-y-1 text-xs">
                      <li>• 埋め込みは必ず新しい行に配置してください</li>
                      <li>• プライベート動画やアクセス制限のある動画は埋め込めません</li>
                      <li>• 動画が削除されている場合は、エラーメッセージが表示されます</li>
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