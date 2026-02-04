import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 認証の判定を行い、保護されたルートへのアクセスを制限する
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 保護されたルートの定義
  const isProtectedRoute =
    pathname.startsWith("/blog/new") ||
    pathname.match(/^\/blog\/[^/]+\/edit/) ||
    pathname.startsWith("/bookmarks") ||
    pathname.startsWith("/settings")

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    const nextPath = url.pathname + url.search
    url.pathname = "/login"
    url.searchParams.set("next", nextPath)

    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
