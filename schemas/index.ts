import { z } from "zod";

// 共通のアクションレスポンス型
export type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  id?: string; // IDを直接返すケースも多いため追加
};

// URLバリデーション用の正規表現
export const URL_REGEX = /^https?:\/\/(?:[-\w.])+(?:[:\d]+)?(?:\/(?:[\w._~:/?#[\]@!$&'()*+,;=-])*)?$/;

// より柔軟なURLバリデーションスキーマ
export const urlSchema = z.string()
  .optional()
  .transform((val) => {
    if (!val || val.trim() === "") return undefined;
    const trimmed = val.trim();
    if (!trimmed.match(/^https?:\/\//i)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  })
  .refine((val) => {
    if (!val) return true;
    try {
      const urlObj = new URL(val);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return URL_REGEX.test(val);
    }
  }, {
    message: "有効なURLを入力してください"
  });

export const SignupSchema = z.object({
  name: z.string().min(1, {
    message: "お名前を入力してください",
  }).max(50, {
    message: "お名前は50文字以内で入力してください",
  }),
  email: z.string().email({
    message: "有効なメールアドレスを入力してください",
  }),
  password: z.string().min(8, {
    message: "パスワードは英数字8文字以上で入力してください",
  }),
  privacyPolicy: z.boolean().refine(val => val === true, {
    message: "プライバシーポリシーへの同意が必要です"
  }).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email({
    message: "メールアドレスを入力してください",
  }),
  password: z.string().min(1, {
    message: "パスワードを入力してください",
  }),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email({
    message: "メールアドレスを入力してください",
  }),
});

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
    path: ["confirmation"],
  });

export const EmailSchema = z.object({
  email: z.string().email({
    message: "有効なメールアドレスを入力してください",
  }),
});

export const BlogSchema = z.object({
  title: z.string().min(1, { message: "タイトルは必須です" }).max(100, { message: "タイトルは100文字以内で入力してください" }),
  content: z.string().min(1, { message: "内容は必須です" }),
  content_json: z.string().optional(),
  summary: z.string().max(200, { message: "要約は200文字以内で入力してください" }).optional(),
  tags: z.array(z.string()).optional(),
  is_published: z.boolean().optional(),
  coauthors: z.array(z.string()).optional(),
  // imageUrl はサーバー側で個別に処理するため、スキーマから除外
});

export const SocialLinksSchema = z.object({
  twitter: urlSchema.describe("Twitter URL"),
  github: urlSchema.describe("GitHub URL"),
  linkedin: urlSchema.describe("LinkedIn URL"),
  instagram: urlSchema.describe("Instagram URL"),
  facebook: urlSchema.describe("Facebook URL"),
});

export const ProfileSchema = z.object({
  name: z.string()
    .min(1, { message: "名前は必須です" })
    .max(50, { message: "名前は50文字以内で入力してください" }),
  introduce: z.string()
    .max(500, { message: "自己紹介は500文字以内で入力してください" })
    .optional(),
  header_image_url: urlSchema.nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  homepage_url: urlSchema.nullable(),
  social_links: SocialLinksSchema.optional().nullable()
});

export const CollectionSchema = z.object({
  title: z.string()
    .min(1, { message: "タイトルは必須です" })
    .max(100, { message: "タイトルは100文字以内で入力してください" }),
  description: z.string()
    .max(500, { message: "説明は500文字以内で入力してください" })
    .optional(),
  is_public: z.boolean().default(true),
});
