import { Loader2 } from "lucide-react"
import Image from "next/image"

// 背景が真っ白でかわいいローディング画面
const Loading = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background">
      <div className="relative w-32 h-32 mb-4">
        <Image 
          src="/og-image.png" 
          alt="Loading mascot" 
          width={128} 
          height={128}
          className="animate-bounce"
          priority
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-lg font-medium text-foreground">読み込み中...</p>
      </div>
      
      <p className="mt-4 text-sm text-muted-foreground">しばらくお待ちください</p>
    </div>
  )
}

export default Loading