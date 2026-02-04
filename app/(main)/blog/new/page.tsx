import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import BlogNew from "@/components/blog/BlogNew"

const BlogNewPage = async () => {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    redirect("/login?next=/blog/new")
  }

  return <BlogNew userId={user.id} />
}

export default BlogNewPage
