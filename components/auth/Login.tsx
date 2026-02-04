"use client"

import { useState, useTransition } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { ChevronRight, Loader2, EyeOffIcon, EyeIcon, Chrome } from "lucide-react"
import { LoginSchema } from "@/schemas"
import { login, signInWithGoogle } from "@/actions/auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import FormError from "@/components/auth/FormError"
import Link from "next/link"
import { useEffect } from "react"

interface LoginProps {
  next?: string
}

// ログイン
const Login = ({ next }: LoginProps) => {
  const router = useRouter()
  const [error, setError] = useState("")

  useEffect(() => {
    if (next) {
      toast.info("ログインが必要です。続行するにはログインしてください。")
    }
  }, [next])
  const [passwordVisibility, setPasswordVisibility] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isGooglePending, setIsGooglePending] = useState(false)

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // メールログイン送信
  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("")

    startTransition(async () => {
      try {
        const res = await login({
          ...values,
        })

        if (res?.error) {
          setError(res.error)
          return
        }

        toast.success("ログインしました")
        router.push(next || "/")
      } catch (error) {
        console.error(error)
        setError("エラーが発生しました")
      }
    })
  }

  // Googleログイン
  const handleGoogleLogin = async () => {
    setIsGooglePending(true)
    setError("")

    try {
      const res = await signInWithGoogle(next)

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
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />

      <Card className="relative w-full shadow-xl border-border/50 bg-background/80 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
        
        <CardHeader className="text-center pt-10 pb-6">
          <CardTitle className="text-2xl font-black tracking-tight mb-2">
            おかえりなさい！
          </CardTitle>
          <CardDescription className="text-base">
            ログインして、あなたの続きを表現しましょう。
          </CardDescription>
        </CardHeader>
        <CardContent className="p-10 pt-4">
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
            <span>Googleでログイン</span>
          </Button>

          <div className="relative my-8">
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
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

            <div className="space-y-4 w-full">
              <FormError message={error} />
              <Button
                type="submit"
                className="w-full space-x-2 font-bold h-11 text-base shadow-md transition-all active:scale-[0.98]"
                disabled={isPending || isGooglePending}
              >
                {isPending && <Loader2 className="animate-spin" />}
                <span>ログインする</span>
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-3 pb-12">
        <Link
          href="/reset-password"
          className="text-sm text-primary font-bold"
        >
          パスワードをお忘れの方はこちら{" "}
          <ChevronRight className="w-4 h-4 inline align-text-bottom" />
        </Link>
        <Link href="/signup" className="text-sm text-primary font-bold">
          アカウント登録はこちら{" "}
          <ChevronRight className="w-4 h-4 inline align-text-bottom" />
        </Link>
      </CardFooter>
    </Card>
    </div>
  )
}

export default Login