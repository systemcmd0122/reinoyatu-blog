"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Wand2, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import MarkdownRenderer from "./markdown/MarkdownRenderer";

import { GenerationOptions } from "@/types";

interface AICustomizeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  originalContent: {
    title: string;
    content: string;
  };
  onApply: (content: string) => void;
  onGenerate: (styles: string[], options: GenerationOptions) => Promise<void>;
  generatedContent: string | null;
  isGenerating: boolean;
}

interface StyleOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const styleOptions: StyleOption[] = [
  {
    id: "professional",
    label: "プロフェッショナル",
    description: "ビジネスや専門的な文章スタイル",
    icon: "👔",
  },
  {
    id: "casual",
    label: "カジュアル",
    description: "親しみやすい読みやすい文章",
    icon: "😊",
  },
  {
    id: "technical",
    label: "技術的",
    description: "IT・技術文書向けの明確な説明",
    icon: "💻",
  },
  {
    id: "educational",
    label: "教育的",
    description: "わかりやすい解説と例示",
    icon: "📚",
  },
  {
    id: "storytelling",
    label: "ストーリー形式",
    description: "物語のように魅力的な展開",
    icon: "📖",
  },
  {
    id: "minimal",
    label: "ミニマル",
    description: "簡潔で要点を押さえた内容",
    icon: "✨",
  },
];

const presets = [
  {
    id: "tech_doc",
    label: "技術ドキュメント",
    styles: ["professional", "technical"],
    icon: "⚙️",
  },
  {
    id: "tutorial",
    label: "チュートリアル",
    styles: ["educational", "casual"],
    icon: "📝",
  },
  {
    id: "blog_post",
    label: "ブログ記事",
    styles: ["storytelling", "casual"],
    icon: "✍️",
  },
  {
    id: "seo_optimized",
    label: "SEO強化",
    styles: ["professional", "minimal"],
    icon: "📈",
  },
  {
    id: "social_media",
    label: "SNSシェア",
    styles: ["casual", "storytelling"],
    icon: "📣",
  },
];

const AICustomizeDialog: React.FC<AICustomizeDialogProps> = ({
  isOpen,
  onClose,
  originalContent,
  onApply,
  onGenerate,
  generatedContent,
  isGenerating,
}) => {
  const [selectedStyles, setSelectedStyles] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("style");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState<GenerationOptions>({
    keepStructure: true,
    preserveLinks: true,
    enhanceReadability: true,
  });

  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (isOpen) {
      setSelectedStyles(new Set());
      setError(null);
      setProgress(0);
      setActiveTab("style");
    }
  }, [isOpen]);

  const handleStyleToggle = (styleId: string) => {
    setSelectedStyles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(styleId)) {
        newSet.delete(styleId);
      } else if (newSet.size < 3) {
        newSet.add(styleId);
      } else {
        setError("スタイルは最大3つまで選択できます");
        return prev;
      }
      setError(null);
      return newSet;
    });
  };

  const handlePresetSelect = (preset: typeof presets[0]) => {
    setSelectedStyles(new Set(preset.styles));
    setError(null);
  };

  const handleGenerate = async () => {
    if (selectedStyles.size === 0) {
      setError("スタイルを1つ以上選択してください");
      return;
    }

    try {
      setError(null);
      setProgress(0);
      
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      await onGenerate(Array.from(selectedStyles), options);
      
      clearInterval(progressInterval);
      setProgress(100);
      setActiveTab("preview");
    } catch (err) {
      setError("生成中にエラーが発生しました");
      console.error(err);
    }
  };

  const handleApply = () => {
    if (generatedContent) {
      onApply(generatedContent);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "bg-card text-card-foreground",
        isMobile ? "w-[95vw] max-w-none" : "max-w-4xl"
      )}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            AIによる記事の改善
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="style" disabled={isGenerating}>
                スタイル選択
              </TabsTrigger>
              <TabsTrigger value="preview" disabled={isGenerating && !generatedContent}>
                プレビュー
              </TabsTrigger>
            </TabsList>

            <TabsContent value="style" className="mt-4 space-y-4">
              <Alert>
                <Wand2 className="h-4 w-4" />
                <AlertDescription>
                  記事の改善スタイルを選択してください。プリセットを選ぶか、最大3つのカスタムスタイルを組み合わせて、AIによるリライトの方向性を指定できます。
                </AlertDescription>
              </Alert>

              {/* プリセット選択 */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">おすすめプリセット</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {presets.map(preset => (
                    <Button
                      key={preset.id}
                      variant="outline"
                      className={cn(
                        "h-auto py-4 flex flex-col items-center space-y-1",
                        selectedStyles.size > 0 &&
                        preset.styles.every(s => selectedStyles.has(s)) &&
                        "border-primary"
                      )}
                      onClick={() => handlePresetSelect(preset)}
                      disabled={isGenerating}
                    >
                      <span className="text-2xl">{preset.icon}</span>
                      <span className="text-sm font-medium">{preset.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* カスタムスタイル選択 */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">
                  カスタムスタイル（最大3つまで）
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {styleOptions.map(style => (
                    <Button
                      key={style.id}
                      variant="outline"
                      className={cn(
                        "h-auto py-3 px-4 flex flex-col items-start space-y-1",
                        selectedStyles.has(style.id) && "border-primary bg-primary/5"
                      )}
                      onClick={() => handleStyleToggle(style.id)}
                      disabled={isGenerating}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{style.icon}</span>
                        <span className="font-medium">{style.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground text-left">
                        {style.description}
                      </p>
                    </Button>
                  ))}
                </div>
              </div>

              {/* オプション設定 */}
              <div className="space-y-2 p-4 border rounded-lg">
                <h3 className="text-sm font-medium mb-3">オプション</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={options.keepStructure}
                        onChange={e => setOptions(prev => ({ ...prev, keepStructure: e.target.checked }))}
                        className="rounded border-gray-300"
                        disabled={isGenerating}
                      />
                      <span className="text-sm">見出しやリストの構造を維持</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={options.preserveLinks}
                        onChange={e => setOptions(prev => ({ ...prev, preserveLinks: e.target.checked }))}
                        className="rounded border-gray-300"
                        disabled={isGenerating}
                      />
                      <span className="text-sm">記事内のリンクをすべて保持</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={options.enhanceReadability}
                        onChange={e => setOptions(prev => ({ ...prev, enhanceReadability: e.target.checked }))}
                        className="rounded border-gray-300"
                        disabled={isGenerating}
                      />
                      <span className="text-sm">読みやすさを向上</span>
                    </label>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm">要約の追加</span>
                    <select
                      value={options.summaryLength || ''}
                      onChange={e => setOptions(prev => ({ ...prev, summaryLength: e.target.value as typeof options.summaryLength }))}
                      className="w-full rounded-md border border-input p-2 text-sm bg-background text-foreground"
                      disabled={isGenerating}
                    >
                      <option value="">追加しない</option>
                      <option value="short">短い (3文程度)</option>
                      <option value="medium">中程度 (5文程度)</option>
                      <option value="long">詳細</option>
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* 選択されたスタイル表示 */}
              {selectedStyles.size > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedStyles).map(styleId => {
                    const style = styleOptions.find(s => s.id === styleId);
                    if (!style) return null;
                    return (
                      <Badge
                        key={styleId}
                        variant="secondary"
                        className="px-2 py-1"
                      >
                        <span className="mr-1">{style.icon}</span>
                        {style.label}
                        <button
                          onClick={() => handleStyleToggle(styleId)}
                          className="ml-2 hover:text-destructive"
                          disabled={isGenerating}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* 生成ボタン */}
              <Button
                onClick={handleGenerate}
                disabled={selectedStyles.size === 0}
                loading={isGenerating}
                loadingText="生成中..."
                className="w-full"
              >
                {!isGenerating && <Wand2 className="mr-2 h-4 w-4" />}
                AIで改善する
              </Button>

              {isGenerating && (
                <Progress value={progress} className="w-full h-2" />
              )}
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <div className="space-y-4">
                {/* プレビュー */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">オリジナル</h3>
                    <ScrollArea className="h-[400px] border rounded-lg p-4">
                      <MarkdownRenderer content={originalContent.content} />
                    </ScrollArea>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">改善後</h3>
                    <ScrollArea className="h-[400px] border rounded-lg p-4">
                      {isGenerating ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                      ) : generatedContent ? (
                        <MarkdownRenderer content={generatedContent} />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          AIが生成した内容がここに表示されます
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter className="mt-6">
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isGenerating}
            >
              キャンセル
            </Button>
            <Button
              variant="default"
              onClick={handleApply}
              disabled={!generatedContent || isGenerating}
            >
              この内容を使用
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AICustomizeDialog;