"use server"

import { createClient } from "@/utils/supabase/server"

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export const submitContact = async (formData: ContactFormData): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from("contacts")
      .insert({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      })

    if (error) throw error

    return { success: true }
  } catch (err: any) {
    console.error("お問い合わせ送信エラー:", err)
    return { success: false, error: "送信に失敗しました。しばらく経ってからもう一度お試しください。" }
  }
}
