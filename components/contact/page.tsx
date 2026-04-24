// components/contact/page.tsx
"use client"

import { Mail, MessageSquare, Twitter, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const Contact = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // お問い合わせフォームの送信ロジック
            // 実装例：メール送信またはデータベース保存
            console.log("Form submitted:", formData)

            // ここではダミーの成功メッセージを表示
            toast.success("メッセージを送信しました。ご連絡ありがとうございます。")

            setFormData({
                name: "",
                email: "",
                subject: "",
                message: ""
            })
        } catch (error) {
            console.error("Error:", error)
            toast.error("送信に失敗しました。もう一度お試しください。")
        } finally {
            setIsLoading(false)
        }
    }

    const contactMethods = [
        {
            icon: Mail,
            title: "メール",
            description: "公式メールアドレス",
            contact: "Tisk.address@gmail.com",
            color: "text-blue-500"
        },
        {
            icon: MessageSquare,
            title: "お問い合わせフォーム",
            description: "ご質問やご意見をお送りください",
            contact: "",
            color: "text-green-500"
        },
        {
            icon: Twitter,
            title: "Twitter",
            description: "@min_brother2158",
            contact: "https://x.com/min_brother2158",
            color: "text-cyan-500"
        }
    ]

    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
            {/* ヘッダー */}
            <div className="max-w-4xl mx-auto text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-bold mb-4">
                    <MessageCircle className="h-4 w-4" />
                    <span>お気軽にお問い合わせください</span>
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6">
                    お問い合わせ
                </h1>
                <p className="text-lg text-muted-foreground">
                    ご質問、ご提案、バグ報告など、どんなことでも構いません。
                    <br className="hidden sm:block" />
                    あなたのフィードバックはサービス改善の原動力です。
                </p>
            </div>

            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                    {/* 連絡方法 */}
                    {contactMethods.map((method, idx) => {
                        const Icon = method.icon
                        return (
                            <div
                                key={idx}
                                className="bg-card border border-border rounded-lg p-8 shadow-sm transition-all duration-300"
                            >
                                <div className={`${method.color} mb-4`}>
                                    <Icon className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">{method.title}</h3>
                                <p className="text-sm text-muted-foreground mb-3">{method.description}</p>
                                <p className="font-semibold text-foreground">{method.contact}</p>
                            </div>
                        )
                    })}
                </div>

                {/* お問い合わせフォーム */}
                <div className="bg-card border border-border rounded-lg p-8 sm:p-12 max-w-2xl mx-auto shadow-sm">
                    <h2 className="text-3xl font-bold text-foreground mb-8">お問い合わせフォーム</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-2">
                                お名前
                            </label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="山田 太郎"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="h-12 rounded-lg"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                                メールアドレス
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="your@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="h-12 rounded-lg"
                            />
                        </div>

                        <div>
                            <label htmlFor="subject" className="block text-sm font-semibold text-foreground mb-2">
                                件名
                            </label>
                            <Input
                                id="subject"
                                name="subject"
                                type="text"
                                placeholder="お問い合わせの件名"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                                className="h-12 rounded-lg"
                            />
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-sm font-semibold text-foreground mb-2">
                                ご質問・ご意見
                            </label>
                            <Textarea
                                id="message"
                                name="message"
                                placeholder="ご質問やご提案をお聞きします..."
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows={6}
                                className="rounded-lg resize-none"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-lg font-bold text-base"
                        >
                            {isLoading ? "送信中..." : "送信する"}
                        </Button>
                    </form>

                    <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
                        <p className="text-sm text-muted-foreground">
                            <strong>プライバシー:</strong> お客様の個人情報は、
                            <a href="/privacy" className="text-primary hover:underline">プライバシーポリシー</a>に基づき
                            厳格に保護されます。お返事は通常3営業日以内に送信します。
                        </p>
                    </div>
                </div>

                {/* FAQ セクション */}
                <div className="mt-16 max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold text-foreground mb-8 text-center">よくあるご質問</h2>

                    <div className="space-y-4">
                        <details className="bg-card border border-border rounded-lg p-6 group cursor-pointer">
                            <summary className="font-bold text-foreground flex items-center justify-between">
                                <span>アカウント削除をしたいのですが</span>
                                <span className="group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <p className="text-muted-foreground mt-4">
                                設定ページからアカウント削除をリクエストできます。
                                確認メールが送信されますので、指定のリンクをクリックして削除を完了してください。
                            </p>
                        </details>

                        <details className="bg-card border border-border rounded-lg p-6 group cursor-pointer">
                            <summary className="font-bold text-foreground flex items-center justify-between">
                                <span>不適切なコンテンツを見つけた場合</span>
                                <span className="group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <p className="text-muted-foreground mt-4">
                                記事の右上にある「…」メニューから「報告」を選択してください。
                                詳細な説明を記入していただければ、当社が確認・対応します。
                            </p>
                        </details>

                        <details className="bg-card border border-border rounded-lg p-6 group cursor-pointer">
                            <summary className="font-bold text-foreground flex items-center justify-between">
                                <span>マネタイズについて質問があります</span>
                                <span className="group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <p className="text-muted-foreground mt-4">
                                AdSenseやアフィリエイトプログラムについてのご質問は、
                                このフォームでお送りください。専門チームがお答えします。
                            </p>
                        </details>

                        <details className="bg-card border border-border rounded-lg p-6 group cursor-pointer">
                            <summary className="font-bold text-foreground flex items-center justify-between">
                                <span>他の言語でのサポートは？</span>
                                <span className="group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <p className="text-muted-foreground mt-4">
                                現在、日本語サポートのみとなっています。
                                他の言語でのサポートをご希望の場合は、お問い合わせください。
                            </p>
                        </details>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Contact
