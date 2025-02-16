// components/privacypolicy/page.tsx
import React from 'react'
import { ShieldCheck, FileText, Globe, Lock, RefreshCw } from 'lucide-react'

const PrivacySection = ({ 
  title, 
  children, 
  icon: Icon = FileText 
}: { 
  title: string, 
  children: React.ReactNode, 
  icon?: React.ComponentType<{ className?: string }> 
}) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm hover:shadow-md transition-all duration-300">
    <div className="flex items-center mb-4">
      <Icon className="w-6 h-6 mr-3 text-blue-600" />
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
    </div>
    <div className="text-gray-600 space-y-3">{children}</div>
  </div>
)

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden">
        <div className="bg-blue-600 text-white p-6 text-center">
          <div className="flex justify-center mb-4">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold">プライバシーポリシー</h1>
          <p className="mt-2 text-blue-100">最終更新日: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="p-6 space-y-6">
          <PrivacySection title="個人情報の収集" icon={Globe}>
            <p>
              当サービスは、以下の個人情報を収集および利用いたします：
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2">
              <li>メールアドレス</li>
              <li>お名前(本名ではなくニックネームです)</li>
              <li>プロフィール画像</li>
              <li>ブログ投稿コンテンツ</li>
            </ul>
          </PrivacySection>

          <PrivacySection title="情報利用目的" icon={FileText}>
            <p>
              収集した個人情報は、以下の目的で利用します：
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2">
              <li>ユーザー認証およびアカウント管理</li>
              <li>ブログサービスの提供</li>
              <li>カスタマーサポート</li>
              <li>サービス改善のための分析</li>
            </ul>
          </PrivacySection>

          <PrivacySection title="情報セキュリティ" icon={Lock}>
            <p>
              ユーザーの個人情報を保護するため、以下のセキュリティ対策を実施しています：
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2">
              <li>データの暗号化</li>
              <li>不正アクセス防止</li>
              <li>定期的なセキュリティ監査</li>
              <li>最新のセキュリティ技術の採用</li>
            </ul>
          </PrivacySection>

          <PrivacySection title="第三者への情報提供" icon={Globe}>
            <p>
              法的要求がある場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
              Google OAuth認証を利用する際は、Googleのプライバシーポリシーが適用されます。
            </p>
          </PrivacySection>

          <PrivacySection title="ポリシーの変更" icon={RefreshCw}>
            <p>
              本プライバシーポリシーは、サービス改善のため予告なく変更する場合があります。
              重要な変更については、ウェブサイト上で通知いたします。
            </p>
          </PrivacySection>

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-gray-600">
              個人情報に関するお問い合わせは、サイト管理者までご連絡ください。<br />
              ※サイト上での画像の使用などに関しての著作権などに関してはサイト作成者は一切責任を負いません。<br />
              ※ボットが24時間投稿監視を行っています。規約や法律などに抵触してる場合は投稿を自動で削除する際がございますのでご理解ください。<br />
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy