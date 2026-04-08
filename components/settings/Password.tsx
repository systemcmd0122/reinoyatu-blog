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
import { Loader2, EyeOffIcon, EyeIcon, KeyRound } from "lucide-react"
import { PasswordSchema } from "@/schemas"
import { setPassword } from "@/actions/auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import FormError from "@/components/auth/FormError"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import SaveStatus from "./SaveStatus"

const Password = () => {
  const router = useRouter()
  const [error, setError] = useState("")
  const [passwordVisibility1, setPasswordVisibility1] = useState(false)
  const [passwordVisibility2, setPasswordVisibility2] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<z.infer<typeof PasswordSchema>>({
    resolver: zodResolver(PasswordSchema),
    defaultValues: { password: "", confirmation: "" },
  })

  const onSubmit = (values: z.infer<typeof PasswordSchema>) => {
    setError("")
    startTransition(async () => {
      try {
        const res = await setPassword({ ...values })
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

  const PasswordInput = ({
    name,
    label,
    visible,
    onToggle,
  }: {
    name: "password" | "confirmation"
    label: string
    visible: boolean
    onToggle: () => void
  }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="font-bold">{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                type={visible ? "text" : "password"}
                placeholder="••••••••"
                {...field}
                disabled={isPending}
                className="h-11 pr-11"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center justify-center w-11 text-muted-foreground hover:text-foreground transition-colors"
                onClick={onToggle}
                tabIndex={-1}
                aria-label={visible ? "パスワードを隠す" : "パスワードを表示"}
              >
                {visible ? (
                  <EyeOffIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <div className="space-y-6">
      {/* ヘッダー — モバイルでは縦積み */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">セキュリティ</h2>
          <p className="text-muted-foreground text-sm">
            アカウントのセキュリティ設定を管理し、パスワードを更新します。
          </p>
        </div>
        <SaveStatus status={isPending ? "saving" : isFormDirty ? "unsaved" : "saved"} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <KeyRound className="h-5 w-5 text-primary shrink-0" />
            <CardTitle>パスワード変更</CardTitle>
          </div>
          <CardDescription>
            アカウントを安全に保つために、強力なパスワードを設定してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <PasswordInput
                name="password"
                label="パスワード"
                visible={passwordVisibility1}
                onToggle={() => setPasswordVisibility1(!passwordVisibility1)}
              />
              <PasswordInput
                name="confirmation"
                label="確認用パスワード"
                visible={passwordVisibility2}
                onToggle={() => setPasswordVisibility2(!passwordVisibility2)}
              />
              <div className="space-y-4">
                <FormError message={error} />
                <Button
                  type="submit"
                  className="w-full sm:w-auto h-11 font-bold"
                  disabled={isPending || !isFormDirty}
                >
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  パスワードを更新
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