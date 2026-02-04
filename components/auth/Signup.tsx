"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronRight, Loader2, EyeOffIcon, EyeIcon, Chrome } from "lucide-react"
import { SignupSchema } from "@/schemas"
import { z } from "zod"
import { signup, signInWithGoogle } from "@/actions/auth"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import FormError from "@/components/auth/FormError"
import Link from "next/link"

// サインアップスキーマの拡張
const SignupFormSchema = SignupSchema.extend({
  privacyPolicy: z.boolean().refine(val => val === true, {
    message: "プライバシーポリシーに同意する必要があります",
  })
})

// アカウント登録
const Signup = () => {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const [isGooglePending, setIsGooglePending] = useState(false)
  const [passwordVisibility, setPasswordVisibility] = useState(false)

  // フォームの状態
  const form = useForm<z.infer<typeof SignupFormSchema>>({
    // 入力値の検証
    resolver: zodResolver(SignupFormSchema),
    // 初期値
    defaultValues: {
      name: "",
      email: "",
      password: "",
      privacyPolicy: false,
    },
  })

  // Eメール登録送信
  const onSubmit = async (values: z.infer<typeof SignupFormSchema>) => {
    setError("")

    // privacyPolicyフィールドを除外
    const {...signupValues } = values;

    startTransition(async () => {
      try {
        const res = await signup({
          ...signupValues,
        })

        if (res?.error) {
          setError(res.error)
          return
        }

        toast.success("アカウントを登録しました")
        router.push("/signup/success")
      } catch (error) {
        console.error(error)
        setError("アカウント登録に失敗しました")
      }
    })
  }

  // Googleアカウントでの登録
  const handleGoogleLogin = async () => {
    // プライバシーポリシーのチェックを確認
    if (!form.getValues().privacyPolicy) {
      setError("プライバシーポリシーに同意してください")
      return
    }

    setIsGooglePending(true)
    setError("")

    try {
      const res = await signInWithGoogle()

      if (res?.error) {
        setError(res.error)
        setIsGooglePending(false)
        return
      }

      if (res?.redirectUrl) {
        window.location.href = res.redirectUrl
      }
    } catch (error) {
      console.error(error)
      setError("Googleログインでエラーが発生しました")
      setIsGooglePending(false)
    }
  }

  return (
    <div className="relative w-full max-w-md">
      {/* Decorative background elements */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />

      <Card className="relative w-full shadow-xl border-border/50 bg-background/80 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

        <CardHeader className="text-center pt-8 pb-2">
          <CardTitle className="text-2xl font-black tracking-tight mb-2">
            自由な表現、ここから。
          </CardTitle>
          <CardDescription className="text-base">
            新しいアカウントを作成して、世界と繋がりましょう。
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full space-x-2 font-bold"
            onClick={handleGoogleLogin}
            disabled={isPending || isGooglePending}
          >
            {isGooglePending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Chrome className="w-5 h-5" />
            )}
            <span>Googleで登録</span>
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                または
              </span>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">お名前</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="例の ヤツ"
                      {...field}
                      disabled={isPending || isGooglePending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">メールアドレス</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="example@example.com"
                      {...field}
                      disabled={isPending || isGooglePending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">パスワード</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={passwordVisibility ? "text" : "password"}
                        placeholder="********"
                        {...field}
                        disabled={isPending || isGooglePending}
                      />
                      <div
                        className="absolute inset-y-0 right-0 flex cursor-pointer items-center p-3 text-muted-foreground"
                        onClick={() =>
                          setPasswordVisibility(!passwordVisibility)
                        }
                      >
                        {passwordVisibility ? (
                          <EyeOffIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="privacyPolicy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending || isGooglePending}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      <Link
                        href="/privacy"
                        className="text-primary hover:underline"
                        target="_blank"
                      >
                        プライバシーポリシー
                      </Link>
                      に同意します
                    </FormLabel>
                    <FormDescription>
                      登録する前に、サービスのプライバシーポリシーをご確認ください。
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <div className="space-y-4 w-full">
              <FormError message={error} />
              <Button
                type="submit"
                className="w-full space-x-2 font-bold h-11 text-base shadow-md transition-all active:scale-[0.98]"
                disabled={isPending || isGooglePending}
              >
                {isPending && <Loader2 className="animate-spin" />}
                <span>表現をはじめる</span>
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center pb-8">
        <Link href="/login" className="text-sm text-primary font-bold">
          既にアカウントをお持ちの方はこちら{" "}
          <ChevronRight className="w-4 h-4 inline align-text-bottom" />
        </Link>
      </CardFooter>
    </Card>
    </div>
  )
}

export default Signup