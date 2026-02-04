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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, EyeOffIcon, EyeIcon } from "lucide-react"
import { PasswordSchema } from "@/schemas"
import { setPassword } from "@/actions/auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import FormError from "@/components/auth/FormError"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import SaveStatus from "./SaveStatus"
import { KeyRound } from "lucide-react"

// パスワード変更
const Password = () => {
  const router = useRouter()
  const [error, setError] = useState("")
  const [passwordVisibility1, setPasswordVisibility1] = useState(false)
  const [passwordVisibility2, setPasswordVisibility2] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<z.infer<typeof PasswordSchema>>({
    resolver: zodResolver(PasswordSchema),
    defaultValues: {
      password: "",
      confirmation: "",
    },
  })

  // 送信
  const onSubmit = (values: z.infer<typeof PasswordSchema>) => {
    setError("")

    startTransition(async () => {
      try {
        const res = await setPassword({
          ...values,
        })

        if (res?.error) {
          setError(res.error)
          return
        }

        toast.success("パスワードを変更しました")
        form.reset()
        router.refresh()
      } catch (error) {
        console.error(error)
        setError("エラーが発生しました")
      }
    })
  }

  const isFormDirty = form.formState.isDirty

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">セキュリティ</h2>
          <p className="text-muted-foreground">
            アカウントのセキュリティ設定を管理し、パスワードを更新します。
          </p>
        </div>
        <SaveStatus status={isPending ? "saving" : isFormDirty ? "unsaved" : "saved"} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <CardTitle>パスワード変更</CardTitle>
          </div>
          <CardDescription>
            アカウントを安全に保つために、強力なパスワードを設定してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">パスワード</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={passwordVisibility1 ? "text" : "password"}
                      placeholder="********"
                      {...field}
                      disabled={isPending}
                    />
                    <div
                      className="absolute inset-y-0 right-0 flex cursor-pointer items-center p-3 text-muted-foreground"
                      onClick={() =>
                        setPasswordVisibility1(!passwordVisibility1)
                      }
                    >
                      {passwordVisibility1 ? (
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
            name="confirmation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">確認用パスワード</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={passwordVisibility2 ? "text" : "password"}
                      placeholder="********"
                      {...field}
                      disabled={isPending}
                    />
                    <div
                      className="absolute inset-y-0 right-0 flex cursor-pointer items-center p-3 text-muted-foreground"
                      onClick={() =>
                        setPasswordVisibility2(!passwordVisibility2)
                      }
                    >
                      {passwordVisibility2 ? (
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
                className="space-x-2 font-bold"
                disabled={isPending || !isFormDirty}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <span>パスワードを更新</span>
              </Button>
            </div>
          </form>
        </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Password
