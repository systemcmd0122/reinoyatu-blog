"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bell, Mail, MessageSquare, Heart, UserPlus } from "lucide-react"
import SaveStatus from "./SaveStatus"
import { toast } from "sonner"

const NotificationSettings = () => {
  const [saveStatus, setSaveStatus] = useState<"unsaved" | "saving" | "saved">("saved")
  const [settings, setSettings] = useState({
    email_new_post: true,
    email_new_comment: true,
    email_like: true,
    push_new_post: false,
    push_new_comment: true,
  })

  const handleToggle = (key: keyof typeof settings) => {
    setSaveStatus("unsaved")
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))

    // 疑似保存処理
    setSaveStatus("saving")
    setTimeout(() => {
      setSaveStatus("saved")
      toast.success("通知設定を更新しました")
    }, 800)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">通知</h2>
          <p className="text-muted-foreground">
            どのようなイベントの通知をどの方法で受け取るか設定します。
          </p>
        </div>
        <SaveStatus status={saveStatus} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>メール通知</CardTitle>
          </div>
          <CardDescription>
            登録したメールアドレスに通知を送信します。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">新しい記事</Label>
              <p className="text-sm text-muted-foreground">フォロー中のユーザーが新しい記事を投稿したとき</p>
            </div>
            <Switch
              checked={settings.email_new_post}
              onCheckedChange={() => handleToggle("email_new_post")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">コメント</Label>
              <p className="text-sm text-muted-foreground">自分の記事に新しいコメントがついたとき</p>
            </div>
            <Switch
              checked={settings.email_new_comment}
              onCheckedChange={() => handleToggle("email_new_comment")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">いいね</Label>
              <p className="text-sm text-muted-foreground">自分の記事にいいねがついたとき</p>
            </div>
            <Switch
              checked={settings.email_like}
              onCheckedChange={() => handleToggle("email_like")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>プッシュ通知</CardTitle>
          </div>
          <CardDescription>
            ブラウザやデバイスに通知を表示します（PWA機能）。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">記事の更新</Label>
              <p className="text-sm text-muted-foreground">重要なアップデートやお知らせがあるとき</p>
            </div>
            <Switch
              checked={settings.push_new_post}
              onCheckedChange={() => handleToggle("push_new_post")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">ダイレクトアクション</Label>
              <p className="text-sm text-muted-foreground">返信やメンションがあったとき</p>
            </div>
            <Switch
              checked={settings.push_new_comment}
              onCheckedChange={() => handleToggle("push_new_comment")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default NotificationSettings
