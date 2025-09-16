import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // セッションが正常に確立された場合は指定されたページにリダイレクト
      const redirectUrl = next.startsWith('/') ? `${origin}${next}` : `${origin}/`
      return NextResponse.redirect(redirectUrl)
    }
    
    console.error("Authentication error:", error)
    // エラーが発生した場合のリダイレクト
    return NextResponse.redirect(`${origin}/login?error=AuthenticationError`)
  }

  // codeがない場合のエラーハンドリング
  return NextResponse.redirect(`${origin}/login?error=MissingCode`)
}