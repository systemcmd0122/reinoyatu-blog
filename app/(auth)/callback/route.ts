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
      // リダイレクト先を明示的に設定
      return NextResponse.redirect(`${origin}${next}`)
    }
    
    // エラーが発生した場合のリダイレクト
    return NextResponse.redirect(`${origin}/login?error=AuthenticationError`)
  }

  // codeがない場合のエラーハンドリング
  return NextResponse.redirect(`${origin}/login?error=MissingCode`)
}