"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Wand2, X, ChevronDown, ChevronUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import MarkdownRenderer from "./markdown/MarkdownRenderer";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";

interface AICustomizeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  originalContent: {
    title: string;
    content: string;
  };
  onApply: (content: string) => void;
  onGenerate: (styles: string[]) => Promise<void>;
  generatedContent: string | null;
  isGenerating: boolean;
}

// スタイルカテゴリーの型定義は同じ
type StyleOption = {
  value: string;
  label: string;
  description: string;
};

type StyleCategory = {
  label: string;
  styles: StyleOption[];
};

type StyleCategories = {
  [key: string]: StyleCategory;
};

// スタイルカテゴリーの定義は同じ
const styleCategories: StyleCategories = {
  writing: {
    label: "文章スタイル",
    styles: [
      { value: "professional", label: "プロフェッショナル", description: "ビジネスや専門的な文章" },
      { value: "casual", label: "カジュアル", description: "親しみやすい文章" },
      { value: "academic", label: "アカデミック", description: "学術的な文章" },
      { value: "storytelling", label: "ストーリーテリング", description: "物語調の文章" },
      { value: "technical", label: "技術的", description: "IT・技術的な文章" },
      { value: "journalistic", label: "ジャーナリスティック", description: "新聞・雑誌調" },
      { value: "educational", label: "教育的", description: "わかりやすい解説" },
      { value: "conversational", label: "会話調", description: "対話的な文章" },
    ]
  },
  design: {
    label: "デザイン・構成",
    styles: [
      { value: "minimal_design", label: "ミニマル", description: "シンプルな構成" },
      { value: "visual_hierarchy", label: "視覚的階層", description: "階層的な構成" },
      { value: "scannable", label: "スキャナブル", description: "読みやすい構成" },
      { value: "magazine_style", label: "マガジン", description: "雑誌風レイアウト" },
      { value: "structured", label: "構造化", description: "明確な章立て" },
      { value: "q_and_a", label: "Q&A形式", description: "質問と回答形式" },
      { value: "step_by_step", label: "ステップ形式", description: "手順書形式" },
      { value: "summary_first", label: "サマリー重視", description: "要点先行型" },
    ]
  },
  tone: {
    label: "トーン・印象",
    styles: [
      { value: "friendly", label: "フレンドリー", description: "親しみやすい" },
      { value: "authoritative", label: "権威的", description: "専門的な信頼感" },
      { value: "enthusiastic", label: "情熱的", description: "活力のある" },
      { value: "empathetic", label: "共感的", description: "寄り添う姿勢" },
      { value: "inspirational", label: "インスピレーショナル", description: "感動を与える" },
      { value: "objective", label: "客観的", description: "中立的な視点" },
      { value: "persuasive", label: "説得的", description: "論理的な説得" },
      { value: "humorous", label: "ユーモラス", description: "面白さを含む" },
    ]
  }
};

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
  const [resetKey, setResetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'controls' | 'preview'>('controls');
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // スタイル情報のマップをメモ化
  const styleInfoMap = useMemo(() => {
    const map = new Map<string, StyleOption>();
    Object.values(styleCategories).forEach(category => {
      category.styles.forEach(style => {
        map.set(style.value, style);
      });
    });
    return map;
  }, []);

  // ダイアログが開かれたときの初期化
  useEffect(() => {
    if (isOpen) {
      setSelectedStyles(new Set());
      setError(null);
      setResetKey(prev => prev + 1);
      setActiveView('controls');
      setIsPreviewExpanded(false);
    }
  }, [isOpen]);

  // スタイル選択処理
  const handleStyleSelect = (value: string) => {
    try {
      if (!value) return;
      setSelectedStyles(prev => {
        const newSet = new Set(prev);
        if (newSet.size >= 5) {
          setError("スタイルは最大5つまで選択できます");
          return prev;
        }
        newSet.add(value);
        setError(null);
        return newSet;
      });
    } catch (err) {
      setError("スタイルの選択中にエラーが発生しました");
      console.error("Style selection error:", err);
    }
  };

  // スタイル削除処理
  const handleRemoveStyle = (value: string) => {
    try {
      setSelectedStyles(prev => {
        const newSet = new Set(prev);
        newSet.delete(value);
        return newSet;
      });
      setResetKey(prev => prev + 1);
      setError(null);
    } catch (err) {
      setError("スタイルの削除中にエラーが発生しました");
      console.error("Style removal error:", err);
    }
  };

  // 生成処理
  const handleGenerate = async () => {
    try {
      setError(null);
      await onGenerate(Array.from(selectedStyles));
      if (isMobile) {
        setActiveView('preview');
      }
    } catch (err) {
      setError("生成中にエラーが発生しました");
      console.error("Generation error:", err);
    }
  };

  // 適用処理
  const handleApply = () => {
    try {
      if (generatedContent) {
        onApply(generatedContent);
        onClose();
      }
    } catch (err) {
      setError("生成された内容の適用中にエラーが発生しました");
      console.error("Apply content error:", err);
    }
  };

  // カスタムSelectItem
  const SelectItemCustom = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<typeof SelectItem>
  >(({ className, children, ...props }, ref) => (
    <SelectItem
      ref={ref}
      className={cn(
        "cursor-pointer relative flex select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
        "focus:bg-accent focus:text-accent-foreground",
        "hover:bg-accent hover:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </SelectItem>
  ));
  SelectItemCustom.displayName = "SelectItemCustom";

  // ローディングスケルトン
  const ContentSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );

  // モバイル用のタブボタン
  const MobileTabButton = ({ view, label }: { view: 'controls' | 'preview'; label: string }) => (
    <Button
      variant={activeView === view ? "default" : "outline"}
      onClick={() => setActiveView(view)}
      className="flex-1"
    >
      {label}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "bg-white dark:bg-gray-900 overflow-hidden flex flex-col",
          isMobile ? "w-full h-full max-w-none m-0 rounded-none" : "max-w-4xl h-[90vh]"
        )}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle>AIによる記事カスタマイズ</DialogTitle>
          <DialogDescription>
            AIを使用して記事の内容を改善します。スタイルは最大5つまで組み合わせて選択できます。
          </DialogDescription>
          {isMobile && (
            <div className="flex gap-2 pt-2">
              <MobileTabButton view="controls" label="スタイル選択" />
              <MobileTabButton view="preview" label="プレビュー" />
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* モバイルビュー */}
          {isMobile ? (
            <div className="flex-1 overflow-hidden">
              {activeView === 'controls' ? (
                <div className="h-full overflow-y-auto p-4 space-y-4">
                  {/* スタイル選択部分 */}
                  <div className="space-y-4">
                    {Object.entries(styleCategories).map(([categoryKey, category]) => (
                      <div key={`${categoryKey}-${resetKey}`}>
                        <Select
                          onValueChange={handleStyleSelect}
                          disabled={isGenerating}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={category.label} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>{category.label}</SelectLabel>
                              {category.styles.map((style) => (
                                <SelectItemCustom
                                  key={style.value}
                                  value={style.value}
                                  disabled={selectedStyles.has(style.value)}
                                >
                                  <div className="flex flex-col gap-1">
                                    <span className="font-medium">{style.label}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {style.description}
                                    </span>
                                  </div>
                                </SelectItemCustom>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>

                  {/* 選択されたスタイル */}
                  <ScrollArea className="h-24 w-full border rounded-md">
                    <div className="flex flex-wrap gap-2 p-2">
                      {Array.from(selectedStyles).map((value) => {
                        const style = styleInfoMap.get(value);
                        if (!style) return null;
                        return (
                          <Badge
                            key={value}
                            variant="secondary"
                            className="px-3 py-1 text-sm"
                          >
                            <span className="mr-2">{style.label}</span>
                            <button
                              onClick={() => handleRemoveStyle(value)}
                              disabled={isGenerating}
                              className="hover:text-destructive"
                              aria-label={`${style.label}を削除`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                      {selectedStyles.size === 0 && (
                        <span className="text-sm text-muted-foreground p-1">
                          スタイルを選択してください
                        </span>
                      )}
                    </div>
                  </ScrollArea>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* 生成ボタン */}
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || selectedStyles.size === 0}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        {selectedStyles.size > 0
                          ? `選択したスタイル(${selectedStyles.size}個)で生成`
                          : "スタイルを選択してください"}
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="h-full overflow-y-auto p-4 space-y-4">
                  {/* プレビュー */}
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <Button
                        variant="ghost"
                        onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                        className="w-full flex justify-between items-center mb-2"
                        >
                          <span className="font-medium">オリジナル</span>
                          {isPreviewExpanded ? <ChevronUp /> : <ChevronDown />}
                        </Button>
                        {isPreviewExpanded && (
                          <ScrollArea className="h-[200px]">
                            <div className="space-y-2">
                              <MarkdownRenderer content={originalContent.content} />
                            </div>
                          </ScrollArea>
                        )}
                      </div>
  
                      <div className="rounded-lg border p-4">
                        <h3 className="font-medium mb-2">生成された内容</h3>
                        <ScrollArea className="h-[300px]">
                          {isGenerating ? (
                            <ContentSkeleton />
                          ) : generatedContent ? (
                            <div className="space-y-2">
                              <MarkdownRenderer content={generatedContent} />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-[200px]">
                              <p className="text-muted-foreground text-center">
                                AIが生成した内容がここに表示されます
                              </p>
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // デスクトップビュー
              <div className="flex-1 overflow-hidden p-4">
                <div className="grid grid-cols-2 gap-4 h-full">
                  {/* スタイル選択部分 */}
                  <div className="flex flex-col space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-4">
                      {Object.entries(styleCategories).map(([categoryKey, category]) => (
                        <div key={`${categoryKey}-${resetKey}`}>
                          <Select
                            onValueChange={handleStyleSelect}
                            disabled={isGenerating}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={category.label} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>{category.label}</SelectLabel>
                                {category.styles.map((style) => (
                                  <SelectItemCustom
                                    key={style.value}
                                    value={style.value}
                                    disabled={selectedStyles.has(style.value)}
                                  >
                                    <div className="flex flex-col gap-1">
                                      <span className="font-medium">{style.label}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {style.description}
                                      </span>
                                    </div>
                                  </SelectItemCustom>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
  
                    {/* 選択されたスタイル */}
                    <ScrollArea className="h-24 w-full border rounded-md">
                      <div className="flex flex-wrap gap-2 p-2">
                        {Array.from(selectedStyles).map((value) => {
                          const style = styleInfoMap.get(value);
                          if (!style) return null;
                          return (
                            <Badge
                              key={value}
                              variant="secondary"
                              className="px-3 py-1 text-sm"
                            >
                              <span className="mr-2">{style.label}</span>
                              <button
                                onClick={() => handleRemoveStyle(value)}
                                disabled={isGenerating}
                                className="hover:text-destructive"
                                aria-label={`${style.label}を削除`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                        {selectedStyles.size === 0 && (
                          <span className="text-sm text-muted-foreground p-1">
                            スタイルを選択してください
                          </span>
                        )}
                      </div>
                    </ScrollArea>
  
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
  
                    {/* 生成ボタン */}
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || selectedStyles.size === 0}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          {selectedStyles.size > 0
                            ? `選択したスタイル(${selectedStyles.size}個)で生成`
                            : "スタイルを選択してください"}
                        </>
                      )}
                    </Button>
                  </div>
  
                  {/* プレビュー部分 */}
                  <div className="flex flex-col space-y-4 overflow-hidden">
                    <div className="flex-1 overflow-hidden rounded-lg border">
                      <div className="h-1/2 border-b">
                        <div className="p-2 border-b bg-muted/30">
                          <h3 className="font-medium">オリジナル</h3>
                        </div>
                        <ScrollArea className="h-[calc(100%-2.5rem)]">
                          <div className="p-4">
                            <MarkdownRenderer content={originalContent.content} />
                          </div>
                        </ScrollArea>
                      </div>
                      <div className="h-1/2">
                        <div className="p-2 border-b bg-muted/30">
                          <h3 className="font-medium">生成された内容</h3>
                        </div>
                        <ScrollArea className="h-[calc(100%-2.5rem)]">
                          <div className="p-4">
                            {isGenerating ? (
                              <ContentSkeleton />
                            ) : generatedContent ? (
                              <MarkdownRenderer content={generatedContent} />
                            ) : (
                              <div className="flex items-center justify-center h-full min-h-[100px]">
                                <p className="text-muted-foreground text-center">
                                  AIが生成した内容がここに表示されます
                                </p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
  
          {/* フッター */}
          <DialogFooter className="border-t p-4 mt-auto">
            <div className="flex justify-end gap-2 w-full">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isGenerating}
                className="min-w-[100px]"
              >
                キャンセル
              </Button>
              <Button
                variant="default"
                onClick={handleApply}
                disabled={!generatedContent || isGenerating}
                className="min-w-[100px]"
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