"use client"

import { useState, useTransition } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, AlertTriangle, Mail, Trash2 } from "lucide-react"
import { EmailSchema } from "@/schemas"
import { updateEmail, deleteAccount } from "@/actions/user"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import FormError from "@/components/auth/FormError"
import SaveStatus from "./SaveStatus"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface AccountSettingsProps {
  email: string
}

const AccountSettings = ({ email }: AccountSettingsProps) => {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"unsaved" | "saving" | "saved">("saved")

  const form = useForm<z.infer<typeof EmailSchema>>({
    resolver: zodResolver(EmailSchema),
    defaultValues: {
      email: "",
    },
  })

  const isFormDirty = form.formState.isDirty

  const onSubmit = (values: z.infer<typeof EmailSchema>) => {
    setError("")
    setSaveStatus("saving")

    startTransition(async () => {
      try {
        const res = await updateEmail(values)

        if (res?.error) {
          setError(res.error)
          setSaveStatus("unsaved")
          toast.error(res.error)
          return
        }

        setSaveStatus("saved")
        toast.success("メールアドレス確認用のメールを送信しました。")
        router.push("/email/success")
        router.refresh()
      } catch (error) {
        console.error(error)
        setError("エラーが発生しました")
        setSaveStatus("unsaved")
      }
    })
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const res = await deleteAccount()
      if (res.success) {
        toast.success("アカウントを削除しました")
        router.push("/")
        router.refresh()
      } else {
        toast.error(res.error || "削除に失敗しました")
        setIsDeleting(false)
      }
    } catch (e) {
      toast.error("エラーが発生しました")
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">アカウント</h2>
          <p className="text-muted-foreground">
            メールアドレスの変更やアカウントの管理を行います。
          </p>
        </div>
        <SaveStatus status={isFormDirty ? "unsaved" : saveStatus} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>メールアドレス変更</CardTitle>
          </div>
          <CardDescription>
            現在のメールアドレス: <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>新しいメールアドレス</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="new@example.com"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormError message={error} />
              <Button type="submit" disabled={isPending || !isFormDirty}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                変更内容を保存
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center space-x-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            <CardTitle>アカウントの削除</CardTitle>
          </div>
          <CardDescription className="text-destructive/80">
            アカウントを削除すると、これまでの投稿、コメント、プロフィール情報がすべて失われます。この操作は取り消せません。
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">アカウントを削除する</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>本当にアカウントを削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  この操作は取り消せません。あなたの投稿やデータは完全に削除され、復旧することはできません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "削除する"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  )
}

export default AccountSettings
