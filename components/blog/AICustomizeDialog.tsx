"use client";

import React, { useState, useMemo } from "react";
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
import { Loader2, Wand2, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import MarkdownRenderer from "./markdown/MarkdownRenderer";
import { cn } from "@/lib/utils";

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
  const [resetKey, setResetKey] = useState(0); // Selectコンポーネントの強制リセット用

  // スタイル情報を効率的に検索するためのマップをメモ化
  const styleInfoMap = useMemo(() => {
    const map = new Map<string, StyleOption>();
    Object.values(styleCategories).forEach(category => {
      category.styles.forEach(style => {
        map.set(style.value, style);
      });
    });
    return map;
  }, []);

  const handleStyleSelect = (value: string) => {
    if (!value) return;
    setSelectedStyles(prev => {
      const newSet = new Set(prev);
      newSet.add(value);
      return newSet;
    });
  };

  const handleRemoveStyle = (value: string) => {
    setSelectedStyles(prev => {
      const newSet = new Set(prev);
      newSet.delete(value);
      return newSet;
    });
    // Selectコンポーネントをリセット
    setResetKey(prev => prev + 1);
  };

  // カスタムSelectItemのスタイル
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle>AIによる記事カスタマイズ</DialogTitle>
          <DialogDescription>
            AIを使用して記事の内容を改善します。複数のスタイルを組み合わせて選択できます。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 my-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(styleCategories).map(([categoryKey, category]) => (
              <div key={`${categoryKey}-${resetKey}`} className="space-y-2">
                <Select onValueChange={handleStyleSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder={category.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="px-2 text-sm font-semibold">
                        {category.label}
                      </SelectLabel>
                      {category.styles.map((style) => (
                        <SelectItemCustom
                          key={style.value}
                          value={style.value}
                          disabled={selectedStyles.has(style.value)}
                          className="group"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="font-medium group-hover:text-accent-foreground">
                              {style.label}
                            </span>
                            <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/70">
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

          {/* 選択されたスタイルの表示 */}
          <ScrollArea className="max-h-24">
            <div className="flex flex-wrap gap-2 p-1">
              {Array.from(selectedStyles).map((value) => {
                const style = styleInfoMap.get(value);
                if (!style) return null;
                return (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="px-3 py-1 text-sm group hover:bg-accent/80 transition-colors"
                  >
                    <span className="mr-2">{style.label}</span>
                    <button
                      className="inline-flex items-center justify-center transition-colors group-hover:text-destructive"
                      onClick={() => handleRemoveStyle(value)}
                      disabled={isGenerating}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </ScrollArea>

          <Button
            onClick={() => onGenerate(Array.from(selectedStyles))}
            disabled={isGenerating || selectedStyles.size === 0}
            className="flex items-center space-x-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>生成中...</span>
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                <span>
                  {selectedStyles.size > 0
                    ? `選択したスタイル(${selectedStyles.size}個)で生成`
                    : "スタイルを選択してください"}
                </span>
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">オリジナル</h3>
            <ScrollArea className="h-[40vh] border rounded-md p-4 bg-white dark:bg-gray-800">
              <MarkdownRenderer content={originalContent.content} />
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">生成された内容</h3>
            <ScrollArea className="h-[40vh] border rounded-md p-4 bg-white dark:bg-gray-800">
              {generatedContent ? (
                <MarkdownRenderer content={generatedContent} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground text-center">
                    AIが生成した内容がここに表示されます
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isGenerating}
          >
            キャンセル
          </Button>
          <Button
            variant="default"
            onClick={() => onApply(generatedContent || "")}
            disabled={!generatedContent || isGenerating}
          >
            この内容を使用
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AICustomizeDialog;