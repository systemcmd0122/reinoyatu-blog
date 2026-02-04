// components/privacypolicy/page.tsx
import React from 'react';
import { ShieldCheck, FileText, Globe, Lock, RefreshCw, Mail, AlertCircle } from 'lucide-react';

// プライバシーセクションコンポーネント - 各ポリシーセクションの表示を担当
const PrivacySection = ({ 
  title, 
  children, 
  icon: Icon = FileText 
}: { 
  title: string, 
  children: React.ReactNode, 
  icon?: React.ComponentType<{ className?: string }> 
}) => (
  <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-sm hover:shadow-md transition-all duration-300">
    <div className="flex items-center mb-4">
      <Icon className="w-6 h-6 mr-3 text-primary" />
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
    </div>
    <div className="text-muted-foreground space-y-3">{children}</div>
  </div>
);

// 最終更新日を生成する関数
const getFormattedDate = () => {
  const date = new Date();
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

// メインのプライバシーポリシーコンポーネント
const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-card border border-border shadow-xl rounded-xl overflow-hidden">
        {/* ヘッダーセクション */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-8 text-center">
          <div className="flex justify-center mb-4">
            <ShieldCheck className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold">プライバシーポリシー</h1>
          <p className="mt-2 text-blue-100">最終更新日: {getFormattedDate()}</p>
        </div>

        {/* ポリシー内容セクション */}
        <div className="p-8 space-y-6">
          {/* イントロダクション */}
          <div className="text-foreground/90 mb-6">
            <p>当サービスをご利用いただき、ありがとうございます。ユーザーの皆様のプライバシーを尊重し、個人情報の保護に努めています。このプライバシーポリシーでは、当サービスが収集する情報とその利用方法について説明します。</p>
          </div>

          {/* 個人情報の収集 */}
          <PrivacySection title="個人情報の収集" icon={Globe}>
            <p>
              当サービスは、以下の個人情報を収集および利用いたします：
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2 mt-3">
              <li>メールアドレス</li>
              <li>お名前（本名ではなくニックネームです）</li>
              <li>プロフィール画像</li>
              <li>ブログ投稿コンテンツ</li>
            </ul>
          </PrivacySection>

          {/* 情報利用目的 */}
          <PrivacySection title="情報利用目的" icon={FileText}>
            <p>
              収集した個人情報は、以下の目的で利用します：
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2 mt-3">
              <li>ユーザー認証およびアカウント管理</li>
              <li>ブログサービスの提供</li>
              <li>カスタマーサポート</li>
              <li>サービス改善のための分析</li>
            </ul>
          </PrivacySection>

          {/* 情報セキュリティ */}
          <PrivacySection title="情報セキュリティ" icon={Lock}>
            <p>
              ユーザーの個人情報を保護するため、以下のセキュリティ対策を実施しています：
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2 mt-3">
              <li>データの暗号化</li>
              <li>不正アクセス防止</li>
              <li>定期的なセキュリティ監査</li>
              <li>最新のセキュリティ技術の採用</li>
            </ul>
          </PrivacySection>

          {/* 第三者への情報提供 */}
          <PrivacySection title="第三者への情報提供" icon={Globe}>
            <p>
              法的要求がある場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
              Google OAuth認証を利用する際は、Googleのプライバシーポリシーが適用されます。
            </p>
          </PrivacySection>

          {/* ポリシーの変更 */}
          <PrivacySection title="ポリシーの変更" icon={RefreshCw}>
            <p>
              本プライバシーポリシーは、サービス改善のため予告なく変更する場合があります。
              重要な変更については、ウェブサイト上で通知いたします。
            </p>
          </PrivacySection>

          {/* Cookieの利用 */}
          <PrivacySection title="Cookieの利用" icon={FileText}>
            <p>
              当サービスでは、ユーザー体験の向上や利用状況の分析のためにCookieを使用しています。
              ブラウザの設定でCookieを無効にすることも可能ですが、一部の機能が制限される場合があります。
            </p>
          </PrivacySection>

          {/* お問い合わせと注意事項 */}
          <div className="bg-muted/50 rounded-lg p-6 border border-border">
            <div className="flex items-center mb-4">
              <Mail className="w-6 h-6 mr-3 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">お問い合わせ</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              個人情報に関するお問い合わせは、サイト管理者までご連絡ください。
            </p>
            
            <div className="flex items-center mt-6 mb-3">
              <AlertCircle className="w-6 h-6 mr-3 text-amber-500" />
              <h3 className="text-lg font-semibold text-foreground">注意事項</h3>
            </div>
            <ul className="list-disc list-inside pl-4 space-y-2 text-muted-foreground">
              <li>サイト上での画像の使用などに関しての著作権などに関してはサイト作成者は一切責任を負いません。</li>
              <li>ボットが24時間投稿監視を行っています。規約や法律などに抵触してる場合は投稿を自動で削除する際がございますのでご理解ください。</li>
            </ul>
          </div>
        </div>

        {/* フッター */}
        <div className="bg-muted text-muted-foreground p-4 text-center text-sm border-t border-border">
          <p>© {new Date().getFullYear()} 例のヤツ｜ブログ. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;