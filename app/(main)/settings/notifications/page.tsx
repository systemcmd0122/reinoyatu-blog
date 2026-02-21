import NotificationSettings from "@/components/settings/NotificationSettings"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "通知設定",
  description: "新着コメントやリアクションなど、受け取る通知の種類をカスタマイズできます。",
}

const NotificationsPage = () => {
  return <NotificationSettings />
}

export default NotificationsPage
