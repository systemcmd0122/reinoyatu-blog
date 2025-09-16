import { z } from "zod"

export const SignupSchema = z.object({
  name: z.string().min(1, {
    message: "お名前を入力してください",
  }),
  email: z.string().email({
    message: "メールアドレスを入力してください",
  }),
  password: z.string().min(8, {
    message: "英数字8文字以上で入力してください",
  }),
  privacyPolicy: z.boolean().optional(),
})

export const LoginSchema = z.object({
  email: z.string().email({
    message: "メールアドレスを入力してください",
  }),
  password: z.string().min(8, {
    message: "英数字8文字以上で入力してください",
  }),
})

export const ResetPasswordSchema = z.object({
  email: z.string().email({
    message: "メールアドレスを入力してください",
  }),
})

export const PasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "英数字8文字以上で入力してください" }),
    confirmation: z
      .string()
      .min(8, { message: "英数字8文字以上で入力してください" }),
  })
  .refine((data) => data.password === data.confirmation, {
    message: "新しいパスワードと確認用パスワードが一致しません。",
    path: ["confirmation"], // エラーメッセージが適用されるフィールド
  })

export const ProfileSchema = z.object({
  name: z.string().min(1, { message: "お名前を入力してください" }),
  introduce: z.string().optional(),
  website: z.string().url({ message: "有効なURLを入力してください" }).optional().or(z.literal("")),
  email: z.string().email({ message: "有効なメールアドレスを入力してください" }).optional().or(z.literal("")),
  social_links: z
    .object({
      twitter: z.string().url({ message: "有効なURLを入力してください" }).optional().or(z.literal("")),
      github: z.string().url({ message: "有効なURLを入力してください" }).optional().or(z.literal("")),
      linkedin: z.string().url({ message: "有効なURLを入力してください" }).optional().or(z.literal("")),
      instagram: z.string().url({ message: "有効なURLを入力してください" }).optional().or(z.literal("")),
      facebook: z.string().url({ message: "有効なURLを入力してください" }).optional().or(z.literal("")),
    })
    .optional(),
})

export const EmailSchema = z.object({
  email: z.string().email({
    message: "メールアドレスを入力してください",
  }),
})

export const BlogSchema = z.object({
  title: z.string().min(1, { message: "タイトルを入力してください" }),
  content: z.string().min(1, { message: "内容を入力してください" }),
})