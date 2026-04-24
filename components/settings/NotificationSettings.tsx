"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bell, Mail } from "lucide-react"
import SaveStatus from "./SaveStatus"
import { toast } from "sonner"
import { useRealtime } from "@/hooks/use-realtime"
import { createClient } from "@/utils/supabase/client"

const NotificationSettings = () => {
  const [userId, setUserId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<"unsaved" | "saving" | "saved">("saved")
  const [settings, setSettings] = useState({
    email_new_post: true,
    email_new_comment: true,
    email_like: true,
    push_new_post: false,
    push_new_comment: true,
  })

  const supabase = createClient()

  useEffect(() => {
    const fetchUserAndSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: profile } = await supabase
          .from("profiles")
          .select("social_links")
          .eq("id", user.id)
          .single()
        if (profile?.social_links?.notification_settings) {
          setSettings(profile.social_links.notification_settings)
        }
      }
    }
    fetchUserAndSettings()
  }, [])

  const lastEvent = useRealtime<any>("profiles", {
    event: "UPDATE",
    filter: userId ? `id=eq.${userId}` : undefined,
  })

  useEffect(() => {
    const updated = lastEvent?.new
    if (updated?.social_links?.notification_settings) {
      setSettings(updated.social_links.notification_settings)
    }
  }, [lastEvent])

  const handleToggle = async (key: keyof typeof settings) => {
    if (!userId) return
    const newSettings = { ...settings, [key]: !settings[key] }
    setSaveStatus("unsaved")
    setSettings(newSettings)
    setSaveStatus("saving")
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("social_links")
        .eq("id", userId)
        .single()
      const newSocialLinks = {
        ...(profile?.social_links || {}),
        notification_settings: newSettings,
      }
      await supabase
        .from("profiles")
        .update({ social_links: newSocialLinks })
        .eq("id", userId)
      setSaveStatus("saved")
      toast.success("通知設定を更新しました")
    } catch {
      setSaveStatus("unsaved")
      toast.error("保存に失敗しました")
    }
  }

  const NotificationRow = ({
    label,
    description,
    settingKey,
  }: {
    label: string
    description: string
    settingKey: keyof typeof settings
  }) => (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="space-y-0.5 flex-1 min-w-0">
        <Label className="text-base font-semibold cursor-pointer" htmlFor={settingKey}>
          {label}
        </Label>
        <p className="text-sm text-muted-foreground leading-snug">{description}</p>
      </div>
      <Switch
        id={settingKey}
        checked={settings[settingKey]}
        onCheckedChange={() => handleToggle(settingKey)}
        className="shrink-0 mt-0.5"
      />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* ヘッダー — モバイルでは縦積み */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">通知</h2>
          <p className="text-muted-foreground text-sm">
            どのようなイベントの通知をどの方法で受け取るか設定します。
          </p>
        </div>
        <SaveStatus status={saveStatus} />
      </div>

      {/* メール通知 */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-primary shrink-0" />
            <CardTitle>インアプリ通知</CardTitle>
          </div>
          <CardDescription>
            サイト内の通知センターで受け取る通知の設定です。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4">
            現在、すべての通知はインアプリ通知として送信されます。
            メール通知やプッシュ通知は現在サポートされていません。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default NotificationSettings