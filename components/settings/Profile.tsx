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
import { Globe, Loader2, Mail } from "lucide-react"
import { ProfileSchema } from "@/schemas"
import { updateProfile } from "@/actions/user"
import { useRouter } from "next/navigation"
import { ProfileType } from "@/types"
import ImageUploading, { ImageListType } from "react-images-uploading"
import toast from "react-hot-toast"
import Image from "next/image"
import FormError from "@/components/auth/FormError"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ProfileProps {
  profile: ProfileType
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
    } as z.infer<typeof ProfileSchema>,
  })

  // フォームの変更を監視
  useEffect(() => {
    const subscription = form.watch(() => setIsDirty(true));
    return () => subscription.unsubscribe();
  }, [form]);

  // キャンセル処理
  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm("未保存の変更があります。破棄してもよろしいですか？")) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  // 送信
  const onSubmit = async (values: z.infer<typeof ProfileSchema>) => {
    try {
      setError("");
      setIsSaving(true);
      
      // ソーシャルリンクの空文字をnullに変換
      const social_links = Object.entries(values.social_links || {}).reduce((acc, [key, value]) => {
        if (value && value.trim() !== "") {
          acc[key] = value.trim();
        }
        return acc;
      }, {} as Record<string, string>);

      let base64Image: string | undefined;
      
      // 画像の処理
      if (imageUpload[0]?.dataURL && imageUpload[0].dataURL.startsWith("data:image")) {
        base64Image = imageUpload[0].dataURL;
      }

      startTransition(async () => {
        try {
          const res = await updateProfile({
            ...values,
            social_links,
            profile,
            base64Image,
          });

          if (res?.error) {
            setError(res.error);
            toast.error(res.error);
            return;
          }

          setIsDirty(false);
          toast.success("プロフィールを保存しました");
          router.refresh();
        } catch (error) {
          console.error(error);
          setError("プロフィールの更新中にエラーが発生しました");
          toast.error("エラーが発生しました");
        } finally {
          setIsSaving(false);
        }
      });
    } catch (validationError) {
      console.error(validationError);
      toast.error("入力内容を確認してください");
    }
  }

  // 画像アップロード
  const onChangeImage = async (imageList: ImageListType) => {
    try {
      const file = imageList[0]?.file;
      if (!file) {
        setImageUpload(imageList);
        return;
      }

      // ファイルサイズチェック（5MB）
      const maxFileSize = 5 * 1024 * 1024;
      if (file.size > maxFileSize) {
        setError("ファイルサイズは5MB以下にしてください");
        return;
      }

      // 画像の寸法をチェック
      if (imageList[0]?.dataURL) {
        const isValidDimensions = await validateImageDimensions(imageList[0].dataURL);
        if (!isValidDimensions) {
          setError("画像サイズは200x200から2000x2000の範囲である必要があります");
          return;
        }

        // 画像をリサイズ
        const resizedImage = await resizeImage(imageList[0].dataURL);
        setImageUpload([{ ...imageList[0], dataURL: resizedImage }]);
        setError(""); // エラーをクリア
        toast.success("画像を最適化しました");
        return;
      }

      setImageUpload(imageList);
    } catch (error) {
      console.error("画像処理エラー:", error);
      setError("画像の処理中にエラーが発生しました");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>プロフィール設定</CardTitle>
          <CardDescription>
            あなたのプロフィール情報を設定します。これらの情報は公開プロフィールに表示されます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>お名前</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="お名前"
                        disabled={isPending}
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
                        placeholder="自己紹介"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">プロフィール画像</h3>
                <div>
                  <ImageUploading
                    value={imageUpload}
                    onChange={onChangeImage}
                    maxNumber={1}
                    acceptType={["jpg", "png", "jpeg", "gif"]}
                  >
                    {({ imageList, onImageUpload, dragProps }) => (
                      <div className="space-y-4">
                        {imageList.map((image, index) => (
                          <div key={index}>
                            <Image
                              src={image.dataURL || "/default.png"}
                              alt="プロフィール画像"
                              className="rounded-full"
                              width={100}
                              height={100}
                            />
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          disabled={isPending}
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

              <div className="space-y-4">
                <h3 className="text-sm font-medium">連絡先情報</h3>
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>メールアドレス</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              placeholder="your@email.com"
                              className="pl-8"
                              disabled={isPending}
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
                            <Globe className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              placeholder="https://your-website.com"
                              className="pl-8"
                              disabled={isPending}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">ソーシャルリンク</h3>
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="social_links.twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://twitter.com/username"
                            disabled={isPending}
                          />
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
                          <Input
                            {...field}
                            placeholder="https://github.com/username"
                            disabled={isPending}
                          />
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
                          <Input
                            {...field}
                            placeholder="https://linkedin.com/in/username"
                            disabled={isPending}
                          />
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
                          <Input
                            {...field}
                            placeholder="https://instagram.com/username"
                            disabled={isPending}
                          />
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
                          <Input
                            {...field}
                            placeholder="https://facebook.com/username"
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormError message={error} />

              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || !isDirty}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "保存する"
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