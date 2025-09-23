import React, { useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { HelpCircle, Code, Youtube, Music, Clock, BarChart3, Folder, Calendar, ChevronDown } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CodeLanguageSelector, { CodeLanguage } from "./CodeLanguageSelector"

interface MarkdownHelpProps {
  onInsertCodeBlock?: (language: string) => void
}

const MarkdownHelp: React.FC<MarkdownHelpProps> = ({ onInsertCodeBlock }) => {
  const [isOpen, setIsOpen] = useState(false)

  // マークダウン例の改善：より整理されたデザイン
  const markdownExamples = [
    // 基本的な書式
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
    { syntax: "`コード`", description: "インラインコード" },
    
    // リストと構造化
    { syntax: "- リスト項目", description: "箇条書きリスト" },
    { syntax: "1. 番号付きリスト", description: "番号付きリスト" },
    { syntax: "- [ ] タスク", description: "タスク（未完了）" },
    { syntax: "- [x] タスク", description: "タスク（完了）" },
    { syntax: "> 引用文", description: "引用" },
    { syntax: ">> 二重引用", description: "ネストされた引用" },
    { syntax: "---", description: "水平線" },
    
    // リンクとメディア
    { syntax: "[リンク](URL)", description: "ハイパーリンク" },
    { syntax: "![代替テキスト](画像URL)", description: "画像" },
    { syntax: "[![代替テキスト](画像URL)](リンクURL)", description: "リンク付き画像" },
    { syntax: "{{youtube:VIDEO_ID}}", description: "YouTube埋め込み" },
    
    // テーブル
    { syntax: "| 左揃え | 中央揃え | 右揃え |\n|:--|:--:|--:|\n| 左 | 中央 | 右 |", description: "整列指定付きテーブル" },
    
    // 数式
    { syntax: "$x^2 + y^2 = r^2$", description: "インライン数式" },
    { syntax: "$$E = mc^2$$", description: "ブロック数式" },
    
    // 脚注と参照
    { syntax: "テキスト[^1]\n\n[^1]: 脚注の内容", description: "脚注" },
    { syntax: "[参照リンク][ref]\n\n[ref]: URL", description: "参照リンク" },
    
    // コードブロック
    { syntax: "```python\nprint('Hello')\n```", description: "シンタックスハイライト付きコード" },
    
    // アコーディオン
    { syntax: "<details><summary>タイトル</summary>\n内容\n</details>", description: "折りたたみセクション" },
  ]

  // 警告・情報ボックスの例
  const alertExamples = [
    { syntax: ":::info タイトル（任意）\n情報メッセージ\n:::", description: "情報ボックス" },
    { syntax: ":::warning 注意\n警告メッセージ\n:::", description: "警告ボックス" },
    { syntax: ":::error エラー\nエラーメッセージ\n:::", description: "エラーボックス" },
    { syntax: ":::success 成功\n成功メッセージ\n:::", description: "成功ボックス" },
    { syntax: ":::note メモ\nノート内容\n:::", description: "ノートボックス" },
    { syntax: ":::tip ヒント\n役立つヒント\n:::", description: "ヒントボックス" },
    { syntax: ":::important 重要\n重要な情報\n:::", description: "重要ボックス" },
    { syntax: ":::caution 注意\n注意事項\n:::", description: "注意ボックス" },
    { syntax: ":::info 折りたたみ [collapsible]\n折りたたみ可能な内容\n:::", description: "折りたたみ可能なボックス" },
    { syntax: ":::warning カスタムタイトル [collapsible=カスタムタイトル]\n内容\n:::", description: "カスタムタイトル付き折りたたみ" },
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

  // 拡張機能の例
  const enhancedFeatureExamples = [
    // オーディオプレイヤー
    {
      category: "オーディオプレイヤー",
      icon: Music,
      examples: [
        { 
          syntax: "{{audio:https://example.com/audio.mp3}}", 
          description: "基本的なオーディオプレイヤー" 
        },
        { 
          syntax: "{{audio:https://example.com/audio.mp3:音楽のタイトル}}", 
          description: "タイトル付きオーディオプレイヤー" 
        }
      ]
    },
    // カウントダウンタイマー
    {
      category: "カウントダウンタイマー",
      icon: Clock,
      examples: [
        { 
          syntax: "{{countdown:2024-12-31 23:59}}", 
          description: "基本的なカウントダウン" 
        },
        { 
          syntax: "{{countdown:2024-12-31 23:59:新年まで}}", 
          description: "タイトル付きカウントダウン" 
        }
      ]
    },
    // プログレスバー
    {
      category: "プログレスバー",
      icon: BarChart3,
      examples: [
        { 
          syntax: "{{progress:75}}", 
          description: "基本的なプログレスバー（75%）" 
        },
        { 
          syntax: "{{progress:30:50:プロジェクト進捗}}", 
          description: "最大値とラベル付き（30/50）" 
        },
        { 
          syntax: "{{progress:80:100:完了率:green}}", 
          description: "色指定付き（緑色）" 
        }
      ]
    },
    // タブ
    {
      category: "タブ",
      icon: Folder,
      examples: [
        { 
          syntax: "{{tabs:タブ1:内容1|タブ2:内容2|タブ3:内容3}}", 
          description: "基本的なタブ表示" 
        },
        { 
          syntax: "{{tabs:概要:プロジェクトの概要です|詳細:詳細な説明|FAQ:よくある質問}}", 
          description: "実用的なタブ例" 
        }
      ]
    },
    // タイムライン
    {
      category: "タイムライン",
      icon: Calendar,
      examples: [
        { 
          syntax: "{{timeline:2024-01:開始:プロジェクト開始|2024-06:中間:中間報告|2024-12:完了:プロジェクト完了}}", 
          description: "基本的なタイムライン" 
        },
        { 
          syntax: "{{timeline:Phase 1:計画立案|Phase 2:開発作業|Phase 3:テスト}}", 
          description: "フェーズ形式のタイムライン" 
        }
      ]
    },
    // アコーディオン
    {
      category: "アコーディオン",
      icon: ChevronDown,
      examples: [
        { 
          syntax: "{{accordion:質問1:回答1|質問2:回答2|質問3:回答3}}", 
          description: "基本的なアコーディオン" 
        },
        { 
          syntax: "{{accordion:インストール方法:npm install コマンドを実行|使用方法:import して使用|トラブルシューティング:ログを確認してください}}", 
          description: "FAQ形式のアコーディオン" 
        }
      ]
    }
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
      <PopoverContent className="w-[600px] p-0 shadow-lg border-gray-200 dark:border-gray-700">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="w-full grid grid-cols-6 bg-gray-50 dark:bg-gray-800 rounded-t-lg p-1">
            <TabsTrigger value="basic" className="py-2 text-xs">基本構文</TabsTrigger>
            <TabsTrigger value="code" className="py-2 text-xs">コード</TabsTrigger>
            <TabsTrigger value="alert" className="py-2 text-xs">警告・情報</TabsTrigger>
            <TabsTrigger value="youtube" className="py-2 text-xs">YouTube</TabsTrigger>
            <TabsTrigger value="enhanced" className="py-2 text-xs">拡張機能</TabsTrigger>
            <TabsTrigger value="examples" className="py-2 text-xs">使用例</TabsTrigger>
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
                        <li>• <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">note</code> - ノートメッセージ</li>
                        <li>• <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">tip</code> - ヒントメッセージ</li>
                        <li>• <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">important</code> - 重要メッセージ</li>
                        <li>• <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">caution</code> - 注意メッセージ</li>
                      </ul>
                    </div>
                    
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">折りたたみ機能：</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">[collapsible]</code>を追加すると折りたたみ可能になります。
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
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="enhanced">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">拡張機能</h3>
              <div className="space-y-6 max-h-[400px] overflow-y-auto">
                {enhancedFeatureExamples.map((category, categoryIndex) => {
                  const IconComponent = category.icon;
                  return (
                    <div key={categoryIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <IconComponent className="w-5 h-5 mr-2 text-blue-600" />
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">{category.category}</h4>
                      </div>
                      <div className="space-y-3">
                        {category.examples.map((example, exampleIndex) => (
                          <div key={exampleIndex} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                            <code className="block w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 p-2 rounded text-sm font-mono mb-2 shadow-sm">
                              {example.syntax}
                            </code>
                            <span className="text-gray-600 dark:text-gray-400 text-sm">{example.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="examples">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">実用的な使用例</h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">プロジェクト進捗レポート</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{`# プロジェクト進捗レポート

:::info 概要
このレポートでは、プロジェクトの現在の状況をお知らせします。
:::

## 進捗状況

{{progress:75:100:全体進捗:green}}

## スケジュール

{{timeline:2024-01:企画:プロジェクト企画開始|2024-03:開発:開発フェーズ開始|2024-06:テスト:テスト開始|2024-08:リリース:本番リリース}}

## FAQ

{{accordion:予算はどうなっていますか？:予算内で進行しています|スケジュールに遅れはありますか？:現在のところ予定通りです|次のマイルストーンは？:来月末にベータ版リリース予定です}}`}</pre>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">製品ドキュメント</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{`# 製品名 v2.0

:::tip 新機能
バージョン2.0では多くの新機能を追加しました！
:::

## 機能紹介

{{tabs:概要:製品の概要説明です|インストール:npm install product-name|API:API リファレンス|FAQ:よくある質問}}

## デモビデオ

{{youtube:dQw4w9WgXcQ:showDetails=false}}

## サンプルコード

\`\`\`javascript
import { ProductName } from 'product-name';

const product = new ProductName();
product.initialize();
\`\`\`

:::warning 注意
ベータ版のため、本番環境での使用は推奨されません。
:::`}</pre>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">イベント告知</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{`# 年末イベント開催

:::success お知らせ
2024年年末イベントを開催します！
:::

## イベントまでのカウントダウン

{{countdown:2024-12-31 18:00:年末パーティー}}

## 参加予定者

{{progress:45:100:参加者数:blue}}

現在45名の方にご参加いただく予定です。

## イベント詳細

{{tabs:概要:年末を盛大にお祝いしましょう|プログラム:18:00開始、パフォーマンス、抽選会など|会場:東京都渋谷区のイベントホール|注意事項:事前登録が必要です}}

:::warning 重要
参加には事前登録が必要です。12月20日までにお申し込みください。
:::`}</pre>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">学習コンテンツ</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{`# JavaScript 基礎講座

## レッスン内容

{{tabs:変数:let, const, varの違い|関数:function宣言とアロー関数|配列:map, filter, reduceメソッド|オブジェクト:プロパティとメソッド}}

## 学習進度

{{progress:3:10:完了したレッスン:green}}

## 解説動画

{{youtube:dQw4w9WgXcQ}}

## 練習問題

{{accordion:問題1: 変数の宣言:let name = "太郎"; を使って自己紹介文を作ってください|問題2: 配列操作:[1,2,3,4,5]から偶数のみを抽出してください|問題3: 関数作成:2つの数値を受け取って合計を返す関数を作ってください}}

## サンプル音声

{{audio:https://example.com/lesson1.mp3:レッスン1の解説}}`}</pre>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-300">ヒント</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• 複数の機能を組み合わせることで、より魅力的なコンテンツを作成できます</li>
                  <li>• カウントダウンタイマーは実際の日時（YYYY-MM-DD HH:mm形式）で指定してください</li>
                  <li>• プログレスバーの色は blue, green, red, yellow, purple, pink から選択できます</li>
                  <li>• タブやアコーディオンでは複数の情報を整理して表示できます</li>
                  <li>• 警告・情報ボックスは重要な情報を目立たせる際に有効です</li>
                  <li>• すべての機能は通常のMarkdown記法と組み合わせて使用できます</li>
                </ul>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

export default MarkdownHelp