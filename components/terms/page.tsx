// components/terms/page.tsx
"use client"

import { motion } from "framer-motion"
import { FileText } from "lucide-react"

const TermsSection = ({
    title,
    children,
}: {
    title: string,
    children: React.ReactNode,
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-card border border-border rounded-2xl p-8 mb-6"
    >
        <h2 className="text-2xl font-bold text-foreground mb-4">{title}</h2>
        <div className="text-muted-foreground space-y-3">{children}</div>
    </motion.div>
);

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* ヘッダー */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-2xl p-12 text-center mb-12"
                >
                    <div className="flex justify-center mb-4">
                        <FileText className="w-16 h-16" />
                    </div>
                    <h1 className="text-4xl font-bold mb-2">利用規約</h1>
                    <p className="text-blue-100">最終更新: 2026年4月</p>
                </motion.div>

                {/* コンテンツ */}
                <div className="space-y-6">
                    <TermsSection title="1. サービスの利用について">
                        <p>
                            本サービス（「例のヤツ｜ブログ」以下「サービス」）を利用する場合、
                            本規約に同意されたものとみなします。
                        </p>
                        <p>
                            本サービスは、ユーザーが自由にブログ記事を作成、投稿、共有できる
                            プラットフォームです。
                        </p>
                        <p>
                            ユーザーがサービスを利用する際には、Google AdSenseプログラムの
                            ポリシーおよび関連する法令を遵守することが求められます。
                        </p>
                    </TermsSection>

                    <TermsSection title="2. ユーザーの責任">
                        <p className="font-semibold">ユーザーは以下の行為をしてはいけません：</p>
                        <ul className="list-disc list-inside space-y-2 mt-3">
                            <li>他人の知的財産権、著作権、商標を侵害するコンテンツの投稿</li>
                            <li>違法、有害、不道徳、下品なコンテンツの投稿</li>
                            <li>スパム、虚偽情報、詐欺的なコンテンツの投稿</li>
                            <li>個人情報、医療情報、機密情報の無断公開</li>
                            <li>他のユーザーへの嫌がらせ、脅迫、中傷</li>
                            <li>マルウェア、ウイルス、その他の有害なコードの配布</li>
                            <li>サービスの運営を妨害する行為</li>
                        </ul>
                    </TermsSection>

                    <TermsSection title="3. コンテンツポリシー">
                        <p className="font-semibold">サービス上で許容されないコンテンツ：</p>
                        <ul className="list-disc list-inside space-y-2 mt-3">
                            <li>
                                <strong>有用性の低いコンテンツ</strong>
                                ：十分な独自性や価値を提供していないコンテンツ
                            </li>
                            <li>
                                <strong>不適切な政治的内容</strong>
                                ：一方的な政治的プロパガンダや過度に煽動的なコンテンツ
                            </li>
                            <li>
                                <strong>医療詐欺</strong>
                                ：医学的根拠のない治療法や危険な医療情報
                            </li>
                            <li>
                                <strong>金銭詐欺</strong>
                                ：ポンジスキーム、マルチレベルマーケティングなどの詐欺的スキーム
                            </li>
                            <li>
                                <strong>暴力的で下品なコンテンツ</strong>
                                ：暴力、虐待、露骨な内容
                            </li>
                            <li>
                                <strong>児童搾取</strong>
                                ：児童への危害や搾取に関連するコンテンツ
                            </li>
                        </ul>
                    </TermsSection>

                    <TermsSection title="4. コンテンツの権利">
                        <p>
                            ユーザーがサービス上に投稿したコンテンツについて、
                            ユーザーはそのすべての権利を保持します。
                        </p>
                        <p>
                            ただし、サービスがそのコンテンツを表示・配信するために必要な
                            ライセンスをサービスに付与するものとします。
                        </p>
                        <p>
                            ユーザーは、投稿するコンテンツについて、関連するすべての権利を
                            保有していることを保証します。
                        </p>
                    </TermsSection>

                    <TermsSection title="5. サービスの変更と終了">
                        <p>
                            私たちはサービスを予告なく変更、中断、または終了する権利を
                            留保します。
                        </p>
                        <p>
                            緊急の場合を除き、重大な変更については事前に通知を試みます。
                        </p>
                        <p>
                            サービスの終了時には、ユーザーがコンテンツをダウンロードするための
                            合理的な期間を設けます。
                        </p>
                    </TermsSection>

                    <TermsSection title="6. 免責事項">
                        <p>
                            本サービスは「現状のまま」提供され、いかなる保証も
                            いたしません。
                        </p>
                        <p>
                            サービス使用によるいかなる損害についても、
                            当社は責任を負いません。
                        </p>
                        <p>
                            ユーザーはサービスの使用にあたり、自己の責任において行うものとします。
                        </p>
                    </TermsSection>

                    <TermsSection title="7. 有害なコンテンツへの対応">
                        <p>
                            当サービスは、Google AdSenseプログラムのポリシーを厳格に遵守しています。
                        </p>
                        <p className="font-semibold">
                            本規約に違反するコンテンツが発見された場合、
                            以下の措置を講じます：
                        </p>
                        <ul className="list-disc list-inside space-y-2 mt-3">
                            <li>コンテンツの削除</li>
                            <li>ユーザーアカウントの一時停止</li>
                            <li>ユーザーアカウントの永久削除</li>
                            <li>関連当局への報告</li>
                        </ul>
                    </TermsSection>

                    <TermsSection title="8. 知的財産権">
                        <p>
                            サービスのコンテンツ、デザイン、機能は、
                            私たちまたはライセンサーの知的財産です。
                        </p>
                        <p>
                            これらの要素を、明示的な許可なく複製、変更、配布することは
                            禁止されています。
                        </p>
                    </TermsSection>

                    <TermsSection title="9. 準拠法と管轄">
                        <p>
                            本規約は日本法に準拠し、解釈されます。
                        </p>
                        <p>
                            本規約に関する紛争は、日本の裁判所の
                            独占的な管轄に服するものとします。
                        </p>
                    </TermsSection>

                    <TermsSection title="10. 規約の変更">
                        <p>
                            当社は予告なく本規約を変更する権利を留保します。
                        </p>
                        <p>
                            重大な変更については、メール通知またはサイト上での
                            告知を行います。
                        </p>
                        <p>
                            変更後もサービスを継続使用することで、
                            新しい規約に同意されたものとみなします。
                        </p>
                    </TermsSection>

                    <TermsSection title="11. お問い合わせ">
                        <p>
                            本規約に関するご質問やご懸念については、
                            お問い合わせページからご連絡ください。
                        </p>
                    </TermsSection>
                </div>
            </div>
        </div>
    )
}

export default TermsOfService
