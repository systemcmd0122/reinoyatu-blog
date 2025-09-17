import * as z from "zod"

const socialLinksSchema = z.object({
  twitter: z.string().url({ message: "有効なURLを入力してください" }).optional().or(z.literal("")),
  github: z.string().url({ message: "有効なURLを入力してください" }).optional().or(z.literal("")),
  linkedin: z.string().url({ message: "有効なURLを入力してください" }).optional().or(z.literal("")),
  instagram: z.string().url({ message: "有効なURLを入力してください" }).optional().or(z.literal("")),
  facebook: z.string().url({ message: "有効なURLを入力してください" }).optional().or(z.literal(""))
})

export const ProfileSchema = z.object({
  name: z.string()
    .min(1, { message: "名前は必須です" })
    .max(50, { message: "名前は50文字以内で入力してください" }),
  introduce: z.string()
    .max(1000, { message: "自己紹介は1000文字以内で入力してください" })
    .optional()
    .or(z.literal("")),
  website: z.string()
    .url({ message: "有効なURLを入力してください" })
    .optional()
    .or(z.literal("")),
  email: z.string()
    .email({ message: "有効なメールアドレスを入力してください" })
    .optional()
    .or(z.literal("")),
  social_links: socialLinksSchema.optional()
})

export const ImageSchema = z.object({
  base64Image: z.string()
    .refine((value) => value.startsWith('data:image/'), {
      message: "有効な画像形式ではありません"
    })
    .refine((value) => value.length < 5 * 1024 * 1024, {
      message: "画像サイズは5MB以下にしてください"
    })
    .optional()
})

export type ProfileEditType = z.infer<typeof ProfileSchema> & {
  base64Image?: string
}