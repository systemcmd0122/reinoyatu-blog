"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CollectionSchema } from "@/schemas"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { createCollection, updateCollection } from "@/actions/collection"
import { toast } from "sonner"
import { Loader2, Plus, Settings2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface CollectionDialogProps {
  userId: string
  collection?: {
    id: string
    title: string
    description: string | null
    is_public: boolean
  }
  trigger?: React.ReactNode
  onSuccess?: (data?: any) => void
}

export default function CollectionDialog({ userId, collection, trigger, onSuccess }: CollectionDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof CollectionSchema>>({
    resolver: zodResolver(CollectionSchema),
    defaultValues: {
      title: collection?.title || "",
      description: collection?.description || "",
      is_public: collection?.is_public ?? true,
    },
  })

  async function onSubmit(values: z.infer<typeof CollectionSchema>) {
    setIsPending(true)
    try {
      if (collection) {
        const res = await updateCollection(collection.id, values)
        if (res.success) {
          toast.success("コレクションを更新しました")
          setOpen(false)
          onSuccess?.()
          router.refresh()
        } else {
          toast.error(res.error)
        }
      } else {
        const res = await createCollection(userId, values)
        if (res.success) {
          toast.success("コレクションを作成しました")
          setOpen(false)
          onSuccess?.(res.data)
          router.refresh()
        } else {
          toast.error(res.error)
        }
      }
    } catch (error) {
      toast.error("エラーが発生しました")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="rounded-xl font-bold gap-2">
            {collection ? <Settings2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {collection ? "コレクション設定" : "新しく作成"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">
            {collection ? "コレクションを編集" : "シリーズを作成"}
          </DialogTitle>
          <DialogDescription>
            関連記事を一つにまとめて、読みやすいシリーズを作成しましょう。
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">タイトル</FormLabel>
                  <FormControl>
                    <Input placeholder="例: Next.js徹底解説シリーズ" {...field} className="rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">説明</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="このシリーズの内容について説明を書いてください..." 
                      className="rounded-xl min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-2xl border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="font-bold">公開設定</FormLabel>
                    <FormDescription>
                      他のユーザーがこのシリーズを閲覧できるようにします。
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending} className="w-full rounded-xl font-bold h-12">
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {collection ? "変更を保存" : "コレクションを作成"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
