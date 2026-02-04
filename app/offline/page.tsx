import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">オフライン</h1>
          <p className="text-muted-foreground text-lg">
            インターネット接続が利用できません
          </p>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            オフラインの場合、一部の機能が制限されます。
            インターネット接続を確認してください。
          </p>
          
          <div className="pt-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}