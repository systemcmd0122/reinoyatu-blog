"use client"

import { useState, useTransition, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { resizeImage, validateImageDimensions } from "@/lib/image"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Globe, Loader2, Mail, Twitter, Github, Linkedin, Instagram, Facebook, Edit3, Camera, X, Image as ImageIcon } from "lucide-react"
import { ProfileSchema } from "@/schemas"
import { updateProfile } from "@/actions/user"
import { useRouter } from "next/navigation"
import { ProfileType } from "@/types"
import ImageUploading, { ImageListType } from "react-images-uploading"
import { toast } from "sonner"
import Image from "next/image"
import FormError from "@/components/auth/FormError"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ProfileEditDialogProps {
  profile: ProfileType
  trigger?: React.ReactNode
}

// URLの正規化関数
const normalizeUrl = (url: string): string => {
  if (!url || url.trim() === "") return ""
  const trimmed = url.trim()

  if (!trimmed.match(/^https?:\/\//i)) {
    return `https://${trimmed}`
  }
  return trimmed
}

// URLバリデーション関数
const isValidUrl = (url: string): boolean => {
  if (!url || url.trim() === "") return true

  try {
    const normalizedUrl = normalizeUrl(url)
    const urlObj = new URL(normalizedUrl)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

const ProfileEditDialog = ({ profile, trigger }: ProfileEditDialogProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isDirty, setIsDirty] = useState(false)
  const [imageUpload, setImageUpload] = useState<ImageListType>([
    {
      dataURL: profile.avatar_url || "/default.png",
    },
  ])

  const form = useForm<z.infer<typeof ProfileSchema>>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      name: profile.name || "",
      introduce: profile.introduce || "",
      header_image_url: profile.header_image_url || "",
      homepage_url: profile.homepage_url || "",
      email: profile.email || "",
      social_links: {
        twitter: profile.social_links?.twitter || "",
        github: profile.social_links?.github || "",
        linkedin: profile.social_links?.linkedin || "",
        instagram: profile.social_links?.instagram || "",
        facebook: profile.social_links?.facebook || ""
      }
    },
  })

  // フォームの変更を監視
  useEffect(() => {
    const subscription = form.watch(() => setIsDirty(true))
    return () => subscription.unsubscribe()
  }, [form])

  const onSubmit = async (values: z.infer<typeof ProfileSchema>) => {
    try {
      setError("")
      setIsSaving(true)

      const social_links = Object.entries(values.social_links || {}).reduce((acc, [key, value]) => {
        if (value && value.trim() !== "") {
          const normalizedUrl = normalizeUrl(value.trim())
          if (isValidUrl(normalizedUrl)) {
            acc[key] = normalizedUrl
          } else {
            throw new Error(`${key}のURLが無効です: ${value}`)
          }
        }
        return acc
      }, {} as Record<string, string>)

      let homepage_url = ""
      if (values.homepage_url && values.homepage_url.trim() !== "") {
        const normalizedHomepage = normalizeUrl(values.homepage_url.trim())
        if (isValidUrl(normalizedHomepage)) {
          homepage_url = normalizedHomepage
        } else {
          throw new Error(`ホームページのURLが無効です: ${values.homepage_url}`)
        }
      }

      let base64Image: string | undefined
      if (imageUpload[0]?.dataURL && imageUpload[0].dataURL.startsWith("data:image")) {
        base64Image = imageUpload[0].dataURL
      }

      startTransition(async () => {
        try {
          const res = await updateProfile({
            ...values,
            homepage_url,
            social_links,
            profile,
            base64Image,
          })

          if (res?.error) {
            setError(res.error)
            toast.error(res.error)
            return
          }

          setIsDirty(false)
          toast.success("プロフィールを更新しました")
          setOpen(false)
          router.refresh()
        } catch (error) {
          console.error("Profile update error:", error)
          const errorMessage = error instanceof Error ? error.message : "プロフィールの更新中にエラーが発生しました"
          setError(errorMessage)
          toast.error(errorMessage)
        } finally {
          setIsSaving(false)
        }
      })
    } catch (validationError) {
      const errorMessage = validationError instanceof Error ? validationError.message : "入力内容を確認してください"
      setError(errorMessage)
      toast.error(errorMessage)
      setIsSaving(false)
    }
  }

  const onChangeImage = async (imageList: ImageListType) => {
    try {
      const file = imageList[0]?.file
      if (!file) {
        setImageUpload(imageList)
        return
      }

      const maxFileSize = 5 * 1024 * 1024
      if (file.size > maxFileSize) {
        toast.error("ファイルサイズは5MB以下にしてください")
        return
      }

      if (imageList[0]?.dataURL) {
        const isValidDimensions = await validateImageDimensions(imageList[0].dataURL)
        if (!isValidDimensions) {
          toast.error("画像サイズは200x200から2000x2000の範囲である必要があります")
          return
        }

        const resizedImage = await resizeImage(imageList[0].dataURL)
        setImageUpload([{ ...imageList[0], dataURL: resizedImage }])
        setIsDirty(true)
        toast.success("画像を最適化しました")
        return
      }

      setImageUpload(imageList)
      setIsDirty(true)
    } catch (error) {
      toast.error("画像の処理中にエラーが発生しました")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="rounded-md font-bold h-10 px-6">
            <Edit3 className="h-4 w-4 mr-2" />
            プロフィールを編集
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-background border-border">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold">プロフィールを編集</DialogTitle>
          <DialogDescription>
            あなたの公開プロフィール情報を更新します。
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-6 py-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-6">
              {/* Profile Image Section */}
              <div className="flex flex-col items-center justify-center space-y-4 py-4">
                <ImageUploading
                  value={imageUpload}
                  onChange={onChangeImage}
                  maxNumber={1}
                  acceptType={["jpg", "png", "jpeg", "gif"]}
                >
                  {({ imageList, onImageUpload, onImageRemove, dragProps }) => (
                    <div className="relative group">
                      <div className="h-28 w-28 rounded-2xl overflow-hidden border-4 border-muted bg-muted shadow-inner relative">
                        {imageList[0]?.dataURL ? (
                          <Image
                            src={imageList[0].dataURL}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
                            {profile.name?.[0] || "U"}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={onImageUpload}
                          {...dragProps}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Camera className="h-8 w-8 text-white" />
                        </button>
                      </div>
                      {imageList[0]?.dataURL && imageList[0].dataURL !== profile.avatar_url && (
                        <button
                          type="button"
                          onClick={() => onImageRemove(0)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:bg-destructive/90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                </ImageUploading>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  クリックして画像を変更
                </p>
              </div>

              <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">表示名</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="例: 山田 太郎" className="bg-muted/30" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="header_image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">ヘッダー画像URL (GIF/外部画像対応)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            value={field.value || ""}
                            className="pl-10 bg-muted/30"
                            placeholder="https://example.com/image.gif"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="introduce"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">自己紹介</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="あなたのことを教えてください..."
                          className="bg-muted/30 resize-none"
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">メールアドレス</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              value={field.value || ""}
                              className="pl-10 bg-muted/30"
                              placeholder="your@email.com"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="homepage_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">ウェブサイト</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              value={field.value || ""}
                              className="pl-10 bg-muted/30"
                              placeholder="example.com"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">ソーシャルリンク</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="social_links.twitter"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Twitter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                value={field.value || ""}
                                className="pl-10 bg-muted/30"
                                placeholder="Twitter / X"
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="social_links.github"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Github className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                value={field.value || ""}
                                className="pl-10 bg-muted/30"
                                placeholder="GitHub"
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="social_links.linkedin"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Linkedin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                value={field.value || ""}
                                className="pl-10 bg-muted/30"
                                placeholder="LinkedIn"
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="social_links.instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Instagram className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                value={field.value || ""}
                                className="pl-10 bg-muted/30"
                                placeholder="Instagram"
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="social_links.facebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Facebook className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                value={field.value || ""}
                                className="pl-10 bg-muted/30"
                                placeholder="Facebook"
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {error && <FormError message={error} />}
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-muted/20">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isSaving}>
            キャンセル
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSaving || !isDirty}
            className="font-bold px-8"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              "変更を保存"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ProfileEditDialog
