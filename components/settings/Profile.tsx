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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Globe, Loader2, Mail, Twitter, Github, Linkedin, Instagram, Facebook } from "lucide-react"
import { ProfileSchema } from "@/schemas"
import { updateProfile } from "@/actions/user"
import { useRouter } from "next/navigation"
import { ProfileType } from "@/types"
import ImageUploading, { ImageListType } from "react-images-uploading"
import { toast } from "sonner"
import Image from "next/image"
import FormError from "@/components/auth/FormError"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import SaveStatus from "./SaveStatus"

interface ProfileProps {
  profile: ProfileType
}

// URLの正規化関数
const normalizeUrl = (url: string): string => {
  if (!url || url.trim() === "") return ""
  const trimmed = url.trim()
  
  // http://またはhttps://で始まっていない場合は追加
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

const Profile = ({ profile }: ProfileProps) => {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isDirty, setIsDirty] = useState(false)
  const [imageUpload, setImageUpload] = useState<ImageListType>([
    {
      dataURL: profile.avatar_url || "/default.png",
    },
  ])

  // 未保存の変更がある場合に確認
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  const form = useForm<z.infer<typeof ProfileSchema>>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      name: profile.name || "",
      introduce: profile.introduce || "",
      website: profile.website || "",
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

  // キャンセル処理
  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm("未保存の変更があります。破棄してもよろしいですか？")) {
        router.back()
      }
    } else {
      router.back()
    }
  }

  // 送信
  const onSubmit = async (values: z.infer<typeof ProfileSchema>) => {
    try {
      setError("")
      setIsSaving(true)
      
      // ソーシャルリンクのURL正規化と空文字列処理
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

      // WebサイトURLも正規化
      let website = ""
      if (values.website && values.website.trim() !== "") {
        const normalizedWebsite = normalizeUrl(values.website.trim())
        if (isValidUrl(normalizedWebsite)) {
          website = normalizedWebsite
        } else {
          throw new Error(`WebサイトのURLが無効です: ${values.website}`)
        }
      }

      let base64Image: string | undefined
      
      // 画像の処理
      if (imageUpload[0]?.dataURL && imageUpload[0].dataURL.startsWith("data:image")) {
        base64Image = imageUpload[0].dataURL
      }

      startTransition(async () => {
        try {
          const res = await updateProfile({
            ...values,
            website,
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
          toast.success("プロフィールを保存しました")
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
      console.error("Validation error:", validationError)
      const errorMessage = validationError instanceof Error ? validationError.message : "入力内容を確認してください"
      setError(errorMessage)
      toast.error(errorMessage)
      setIsSaving(false)
    }
  }

  // 画像アップロード
  const onChangeImage = async (imageList: ImageListType) => {
    try {
      const file = imageList[0]?.file
      if (!file) {
        setImageUpload(imageList)
        return
      }

      // ファイルサイズチェック（5MB）
      const maxFileSize = 5 * 1024 * 1024
      if (file.size > maxFileSize) {
        setError("ファイルサイズは5MB以下にしてください")
        toast.error("ファイルサイズは5MB以下にしてください")
        return
      }

      // 画像の寸法をチェック
      if (imageList[0]?.dataURL) {
        const isValidDimensions = await validateImageDimensions(imageList[0].dataURL)
        if (!isValidDimensions) {
          setError("画像サイズは200x200から2000x2000の範囲である必要があります")
          toast.error("画像サイズは200x200から2000x2000の範囲である必要があります")
          return
        }

        // 画像をリサイズ
        const resizedImage = await resizeImage(imageList[0].dataURL)
        setImageUpload([{ ...imageList[0], dataURL: resizedImage }])
        setError("") // エラーをクリア
        toast.success("画像を最適化しました")
        setIsDirty(true)
        return
      }

      setImageUpload(imageList)
      setIsDirty(true)
    } catch (error) {
      console.error("画像処理エラー:", error)
      setError("画像の処理中にエラーが発生しました")
      toast.error("画像の処理中にエラーが発生しました")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">プロフィール</h2>
          <p className="text-muted-foreground">
            あなたの公開プロフィールをカスタマイズして、読者に自分を伝えましょう。
          </p>
        </div>
        <SaveStatus status={isSaving ? "saving" : isDirty ? "unsaved" : "saved"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>プロフィール情報</CardTitle>
          <CardDescription>
            これらの情報はあなたのプロフィールページで一般に公開されます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 基本情報 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">基本情報</h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>お名前 *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="お名前"
                          disabled={isPending || isSaving}
                        />
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
                      <FormLabel>自己紹介</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="自己紹介文を入力してください"
                          disabled={isPending || isSaving}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* プロフィール画像 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">プロフィール画像</h3>
                <div>
                  <ImageUploading
                    value={imageUpload}
                    onChange={onChangeImage}
                    maxNumber={1}
                    acceptType={["jpg", "png", "jpeg", "gif"]}
                  >
                    {({ imageList, onImageUpload, onImageRemove, dragProps }) => (
                      <div className="space-y-4">
                        {imageList.map((image, index) => (
                          <div key={index} className="flex items-center space-x-4">
                            <Image
                              src={image.dataURL || "/default.png"}
                              alt="プロフィール画像"
                              className="rounded-full object-cover"
                              width={100}
                              height={100}
                            />
                            <div className="space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isPending || isSaving}
                                onClick={() => onImageRemove(index)}
                              >
                                削除
                              </Button>
                            </div>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          disabled={isPending || isSaving}
                          onClick={onImageUpload}
                          {...dragProps}
                        >
                          画像をアップロード
                        </Button>
                      </div>
                    )}
                  </ImageUploading>
                </div>
              </div>

              {/* 連絡先情報 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">連絡先情報</h3>
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>メールアドレス</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              placeholder="your@email.com"
                              className="pl-10"
                              disabled={isPending || isSaving}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Webサイト</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              placeholder="example.com または https://example.com"
                              className="pl-10"
                              disabled={isPending || isSaving}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-muted-foreground">
                          http://やhttps://がない場合は自動で追加されます
                        </p>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ソーシャルリンク */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">ソーシャルリンク</h3>
                <p className="text-sm text-muted-foreground">
                  URLにhttp://やhttps://がない場合は自動で追加されます
                </p>
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="social_links.twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter / X</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Twitter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              placeholder="x.com/username または https://x.com/username"
                              className="pl-10"
                              disabled={isPending || isSaving}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="social_links.github"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GitHub</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              placeholder="github.com/username または https://github.com/username"
                              className="pl-10"
                              disabled={isPending || isSaving}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="social_links.linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Linkedin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              placeholder="linkedin.com/in/username"
                              className="pl-10"
                              disabled={isPending || isSaving}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="social_links.instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Instagram className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              placeholder="instagram.com/username"
                              className="pl-10"
                              disabled={isPending || isSaving}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="social_links.facebook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Facebook className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              placeholder="facebook.com/username"
                              className="pl-10"
                              disabled={isPending || isSaving}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormError message={error} />

              <div className="flex items-center justify-end gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || (!isDirty && !imageUpload[0]?.dataURL?.startsWith("data:image"))}
                  className="min-w-[120px] bg-primary text-primary-foreground"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "プロフィールを保存"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Profile