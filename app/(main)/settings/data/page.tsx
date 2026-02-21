import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import DataManagement from "@/components/settings/DataManagement"
import { Metadata } from "next"
import { getUserDataStats, getUserBlogs, getUserCollections, getUserImages } from "@/actions/data"

export const metadata: Metadata = {
  title: "データ管理 - 設定",
  description: "あなたの作成した記事や画像の管理・削除が行えます。",
}

const DataSettingsPage = async () => {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    redirect("/login?next=/settings/data")
  }

  const [stats, blogsRes, collectionsRes, imagesRes] = await Promise.all([
    getUserDataStats(user.id),
    getUserBlogs(user.id),
    getUserCollections(user.id),
    getUserImages(user.id),
  ])

  return (
    <DataManagement 
      userId={user.id}
      stats={stats}
      initialBlogs={blogsRes.blogs || []}
      initialCollections={collectionsRes.collections || []}
      initialImages={imagesRes.images || []}
    />
  )
}

export default DataSettingsPage
