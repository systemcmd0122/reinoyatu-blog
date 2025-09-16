import * as z from "zod"

export const ProfileSchema = z.object({
  name: z.string().min(1, { message: "名前は必須です" }),
  introduce: z.string().max(1000, { message: "自己紹介は1000文字以内で入力してください" }).optional(),
})

export type ProfileEditType = z.infer<typeof ProfileSchema> & {
  base64Image?: string
}