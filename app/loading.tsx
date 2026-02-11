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
      
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xl font-black tracking-tight text-foreground uppercase">Fetching Content...</p>
        </div>
        <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">
          最新のデータを取得しています
        </p>
      </div>
      
      <div className="mt-12 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary/20 animate-bounce"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  )
}

export default Loading