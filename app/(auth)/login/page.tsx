import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import Login from "@/components/auth/Login"
import { Suspense } from "react"

const LoginPage = async () => {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user

  if (user) {
    redirect("/")
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Login />
    </Suspense>
  )
}

export default LoginPage