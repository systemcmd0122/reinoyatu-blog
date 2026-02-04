"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"

// 背景が真っ白でかわいい404画面
const NotFound = () => {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="relative w-48 h-48 mb-6">
        <Image 
          src="/og-image.png" 
          alt="Confused mascot" 
          width={192} 
          height={192}
          priority
        />
      </div>
      
      <div className="text-center text-6xl font-bold mb-3 text-primary">404</div>
      <div className="text-center text-2xl font-bold mb-4 text-foreground">
        ページが見つかりませんでした
      </div>
      
      <p className="text-center text-muted-foreground max-w-md mb-8">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      
      <button 
        onClick={() => router.push('/')}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium shadow-md hover:opacity-90 transition-all"
      >
        ホームに戻る
      </button>
    </div>
  )
}

export default NotFound