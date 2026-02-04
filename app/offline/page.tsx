'use client'

import Link from 'next/link'
import { WifiOff, RefreshCcw } from 'lucide-react'

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <WifiOff className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">オフライン</h1>
          <p className="text-muted-foreground text-lg">
            インターネット接続が利用できません
          </p>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
            オフラインの場合、一部の機能が制限されます。
            インターネット接続を確認して、もう一度お試しください。
            以前に訪問したページはキャッシュから読み込まれる場合があります。
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleReload}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow-md transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              再読み込み
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
