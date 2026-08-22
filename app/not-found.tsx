import Image from "next/image"
import Link from "next/link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "404 - ページが見つかりません",
  description: "お探しのページは存在しないか、移動した可能性があります。",
}

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="relative w-48 h-48 mb-6">
        <Image 
          src="/og-image.png" 
          alt="例のヤツ" 
          width={192} 
          height={192}
          priority
        />
      </div>
      
      <h1 className="text-center text-6xl font-bold mb-3 text-primary">404</h1>
      <h2 className="text-center text-2xl font-bold mb-4 text-foreground">
        ページが見つかりませんでした
      </h2>
      
      <p className="text-center text-muted-foreground max-w-md mb-8">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <Link 
          href="/"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium shadow-md hover:opacity-90 transition-all text-center"
        >
          ホームに戻る
        </Link>
        <Link 
          href="/tags"
          className="px-6 py-3 bg-muted text-muted-foreground rounded-full font-medium hover:bg-muted/80 transition-all text-center"
        >
          タグから探す
        </Link>
      </div>

      <nav aria-label="人気のコンテンツ">
        <p className="text-sm text-muted-foreground mb-3">人気のコンテンツ</p>
        <div className="flex gap-4 text-sm">
          <Link href="/" className="text-primary hover:underline">
            最新記事
          </Link>
          <Link href="/about" className="text-primary hover:underline">
            About
          </Link>
          <Link href="/changelog" className="text-primary hover:underline">
            更新履歴
          </Link>
        </div>
      </nav>
    </div>
  )
}

export default NotFound
