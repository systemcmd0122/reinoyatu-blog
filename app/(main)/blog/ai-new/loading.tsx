import { BrandLoader } from "@/components/ui/BrandLoader"

export default function Loading() {
  return (
    <div className="h-[calc(100vh-64px)]">
      <BrandLoader text="AI" subtext="Initializing AI Partner" className="min-h-full" />
    </div>
  )
}
