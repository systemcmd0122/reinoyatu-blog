"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"

// 背景が真っ白でかわいい404画面
const NotFound = () => {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="relative w-48 h-48 mb-6">
        <Image 
          src="/og-image.png" 
          alt="Confused mascot" 
          width={192} 
          height={192}
          priority
        />
      </div>
      
      <div className="text-center text-6xl font-bold mb-3 text-blue-600">404</div>
      <div className="text-center text-2xl font-bold mb-4 text-gray-800">
        ページが見つかりませんでした
      </div>
      
      <p className="text-center text-gray-600 max-w-md mb-8">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      
      <button 
        onClick={() => router.push('/')}
        className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium shadow-md hover:bg-blue-600 transition-colors"
      >
        ホームに戻る
      </button>
    </div>
  )
}

export default NotFound