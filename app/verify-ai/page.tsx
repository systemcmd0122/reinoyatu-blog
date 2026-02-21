import BlogEditor from "@/components/blog/BlogEditor"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI確認用",
  description: "AIによる記事の確認・検証用ページです。",
}

export default function VerifyAIPage() {
  return (
    <div className="h-screen">
      <BlogEditor 
        mode="new" 
        userId="mock-user" 
        onSubmit={async () => ({ success: true, id: "mock-id" })} 
      />
    </div>
  )
}
