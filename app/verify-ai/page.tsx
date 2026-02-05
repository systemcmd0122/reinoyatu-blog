"use client"

import BlogEditor from "@/components/blog/BlogEditor"

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
