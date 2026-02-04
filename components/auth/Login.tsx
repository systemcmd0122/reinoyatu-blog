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

// ログイン
const Login = () => {
  const router = useRouter()
  const [error, setError] = useState("")
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
        router.push("/")
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
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>ログイン</CardTitle>
        <CardDescription>アカウントにログインします</CardDescription>
      </CardHeader>
      <CardContent>
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
                className="w-full space-x-2 font-bold"
                disabled={isPending || isGooglePending}
              >
                {isPending && <Loader2 className="animate-spin" />}
                <span>ログイン</span>
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
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
  )
}

export default Login