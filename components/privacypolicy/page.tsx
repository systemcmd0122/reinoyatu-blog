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
            </p>
            <p className="mt-2">
              当サービスでは、認証やアナリティクス、広告配信のために以下の第三者サービスを利用しています：
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2 mt-3 text-sm">
              <li><strong>Google Auth:</strong> ユーザー認証のために利用されます。</li>
              <li><strong>Vercel Analytics:</strong> サイトの利用状況を把握し、サービス改善に役立てるために利用されています。</li>
              <li><strong>Google AdSense:</strong> 広告配信のために利用されます（詳細は「広告の配信について」をご確認ください）。</li>
            </ul>
          </PrivacySection>

          {/* 広告の配信について */}
          <PrivacySection title="広告の配信について" icon={ShieldCheck}>
            <p>
              当サイトでは、第三者配信事業者である「Google」が提供する広告サービス「Google AdSense」を利用しています。
            </p>
            <p className="mt-2">
              Googleなどの第三者配信事業者は、Cookie（クッキー）を使用して、ユーザーが当サイトや他のウェブサイトに過去にアクセスした際の情報に基づき、適切な広告をユーザーに表示します。
            </p>
            <p className="mt-2">
              Googleが広告Cookieを使用することにより、ユーザーが当サイトや他のサイトにアクセスした際の情報に基づいて、Googleやそのパートナーが適切な広告をユーザーに表示できることになります。
            </p>
            <p className="mt-2">
              ユーザーは、Googleの<a href="https://adssettings.google.com/authenticated" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">広告設定</a>でパーソナライズ広告を無効にすることができます。また、<a href="https://www.aboutads.info/choices" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.aboutads.info</a>にアクセスすれば、第三者配信事業者がパーソナライズ広告の掲載で使用するCookieを無効にできます。
            </p>
          </PrivacySection>

          {/* Cookie（クッキー）の利用 */}
          <PrivacySection title="Cookie（クッキー）の利用" icon={FileText}>
            <p>
              当サービスでは、ユーザーの利便性向上、広告の配信、および統計データの取得のため、Cookieを使用しています。
            </p>
            <p className="mt-2">
              Cookieは、ウェブサイトの利用履歴などをユーザーのコンピュータにファイルとして保存しておく仕組みです。これには氏名、メールアドレス、電話番号、住所など、個人を特定する情報は一切含まれません。
            </p>
            <p className="mt-2">
              ユーザーは、ブラウザの設定によりCookieの受け入れを拒否したり、Cookieが送信された際に警告を表示させたりすることが可能です。設定方法はブラウザによって異なりますので、お使いのブラウザのヘルプをご確認ください。
            </p>
          </PrivacySection>

          {/* ポリシーの変更 */}
          <PrivacySection title="ポリシーの変更" icon={RefreshCw}>
            <p>
              本プライバシーポリシーは、法令の改正やサービスの改善に合わせて予告なく変更する場合があります。
              重要な変更については、本ウェブサイト上での告知等、適切な方法で通知いたします。
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