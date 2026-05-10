"use client"

import { useState, useEffect } from "react"
import {
  Sparkles,
  Save,
  Trash2,
  Loader2,
  Database,
  Info,
  BrainCircuit,
  MessageSquareText,
  UserRound,
  Wand2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { updateAiSettings } from "@/actions/user"

interface AiSettingsProps {
  initialSettings: {
    persona?: string
    instructions?: string
    writingStyle?: string
  }
}

export default function AiSettings({ initialSettings }: AiSettingsProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await updateAiSettings(settings)
      if (res.success) {
        toast.success("AI設定を保存しました")
      } else {
        toast.error(res.error || "保存に失敗しました")
      }
    } catch (error) {
      toast.error("エラーが発生しました")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          AI を育てる
        </h2>
        <p className="text-muted-foreground">
          AIの執筆スタイルや個性をカスタマイズして、あなた専用のアシスタントに成長させましょう。
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="border-primary/10 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <BrainCircuit className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">AIのキャラクター設定</CardTitle>
            </div>
            <CardDescription>
              AIがどのような立場で回答するかを定義します。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                ペルソナ / 肩書き
              </label>
              <Input
                placeholder="例: テクニカルライター、プロの編集者、親しみやすいブロガー"
                value={settings.persona || ""}
                onChange={(e) => setSettings({ ...settings, persona: e.target.value })}
                className="rounded-xl"
              />
              <p className="text-[10px] text-muted-foreground italic">
                ※AIがどのようなトーンで、どの程度の専門性を持って振る舞うかに影響します。
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2">
                <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                カスタム指示 / 知識
              </label>
              <Textarea
                placeholder="例: 技術的な内容を初心者にも分かりやすく解説する。絵文字を適度に使用する。結論から述べる構成にする。"
                value={settings.instructions || ""}
                onChange={(e) => setSettings({ ...settings, instructions: e.target.value })}
                className="min-h-[120px] rounded-xl"
              />
              <p className="text-[10px] text-muted-foreground italic">
                ※執筆時に常に意識してほしいルールや、AIに知っておいてほしいあなた自身の情報を入力してください。
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-muted-foreground" />
                文章スタイル
              </label>
              <Input
                placeholder="例: である調、ですます調、簡潔、情熱的"
                value={settings.writingStyle || ""}
                onChange={(e) => setSettings({ ...settings, writingStyle: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div className="pt-2">
              <Button onClick={handleSave} disabled={isSaving} className="font-bold rounded-xl h-11 px-8">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                設定を保存してAIを育てる
              </Button>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <Card className="border-border/50 bg-muted/20 rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 bg-primary/5 rounded-lg border border-primary/10">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p>
                  このサイトのAIは最新の Qwen 3.6 モデルを利用しています。
                  入力した内容はあなたの執筆体験を向上させるためにのみ使用され、AIのキャラクター設定などはあなた専用にカスタマイズされます。
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
