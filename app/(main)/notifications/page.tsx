import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import NotificationList from "@/components/notifications/NotificationList"
import { Bell } from "lucide-react"

export const metadata = {
  title: "通知 | 例のヤツ",
  description: "あなたのアクティビティに関する通知一覧です。",
}

const NotificationsPage = async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <Bell className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight">通知</h1>
          <p className="text-muted-foreground font-medium">Activity & Updates</p>
        </div>
      </div>

      <NotificationList userId={user.id} />
    </div>
  )
}

export default NotificationsPage
