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

  // ── 認証の判定 ──────────────────────────────────────────
  // セッションCookieが無いユーザー（未ログイン）は getUser() をスキップする。
  // getUser() は Supabase 認証サーバーへのネットワーク往復を伴うため、
  // 公開ページの初回読み込みを高速化する。ログイン済みユーザーは
  // トークンの検証・更新（セッションリフレッシュ）のために毎回実行する。
  const hasSessionCookie = request.cookies
    .getAll()
    .some((c) => c.name.endsWith("-auth-token"))

  let user: { id: string } | null = null
  if (hasSessionCookie) {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser()
    user = sessionUser
  }

  const pathname = request.nextUrl.pathname

  // 保護されたルートの定義
  const isProtectedRoute =
    pathname.startsWith("/blog/new") ||
    pathname.match(/^\/blog\/[^/]+\/edit/) ||
    pathname.startsWith("/bookmarks") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/collections")

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    const nextPath = url.pathname + url.search
    url.pathname = "/login"
    url.searchParams.set("next", nextPath)

    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
