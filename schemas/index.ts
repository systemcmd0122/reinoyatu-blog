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

export const EmailSchema = z.object({
  email: z.string().email({
    message: "メールアドレスを入力してください",
  }),
})

export const BlogSchema = z.object({
  title: z.string().min(1, { message: "タイトルは必須です" }).max(100, { message: "タイトルは100文字以内で入力してください" }),
  content: z.string().min(1, { message: "内容は必須です" }),
  content_json: z.string().optional(),
  summary: z.string().max(200, { message: "要約は200文字以内で入力してください" }).optional(),
  tags: z.array(z.string()).optional(),
  is_published: z.boolean().optional(),
})


// 改良されたURLバリデーション用の正規表現
const urlRegex = /^https?:\/\/(?:[-\w.])+(?:[:\d]+)?(?:\/(?:[\w._~:/?#[\]@!$&'()*+,;=-])*)?$/

// より柔軟なURLバリデーション関数
const validateUrl = (url: string): boolean => {
  if (!url || url.trim() === "") return true // 空文字列は有効
  
  try {
    // URLConstructorを使用した検証
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    // URLConstructorが失敗した場合は正規表現で検証
    return urlRegex.test(url)
  }
}


// プロフィール用のソーシャルリンクスキーマ（修正版）
export const SocialLinksSchema = z.object({
  twitter: z.string()
    .optional()
    .refine((val) => validateUrl(val || ""), {
      message: "有効なTwitterのURLを入力してください（例: https://x.com/username）"
    }),
  github: z.string()
    .optional()
    .refine((val) => validateUrl(val || ""), {
      message: "有効なGitHubのURLを入力してください（例: https://github.com/username）"
    }),
  linkedin: z.string()
    .optional()
    .refine((val) => validateUrl(val || ""), {
      message: "有効なLinkedInのURLを入力してください（例: https://linkedin.com/in/username）"
    }),
  instagram: z.string()
    .optional()
    .refine((val) => validateUrl(val || ""), {
      message: "有効なInstagramのURLを入力してください（例: https://instagram.com/username）"
    }),
  facebook: z.string()
    .optional()
    .refine((val) => validateUrl(val || ""), {
      message: "有効なFacebookのURLを入力してください（例: https://facebook.com/username）"
    })
})

// プロフィールスキーマ（修正版）
export const ProfileSchema = z.object({
  name: z.string()
    .min(1, { message: "名前は必須です" })
    .max(50, { message: "名前は50文字以内で入力してください" }),
  introduce: z.string()
    .max(500, { message: "自己紹介は500文字以内で入力してください" })
    .optional(),
  email: z.string()
    .optional()
    .refine((val) => !val || val.trim() === "" || z.string().email().safeParse(val).success, {
      message: "有効なメールアドレスを入力してください"
    }),
  website: z.string()
    .optional()
    .refine((val) => validateUrl(val || ""), {
      message: "有効なWebサイトのURLを入力してください（例: https://example.com）"
    }),
  social_links: SocialLinksSchema.optional()
})

export const CollectionSchema = z.object({
  title: z.string()
    .min(1, { message: "タイトルは必須です" })
    .max(100, { message: "タイトルは100文字以内で入力してください" }),
  description: z.string()
    .max(500, { message: "説明は500文字以内で入力してください" })
    .optional(),
  is_public: z.boolean().default(true),
})