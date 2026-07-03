-- お問い合わせテーブルを作成
CREATE TABLE IF NOT EXISTS contacts (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS設定
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 誰でもINSERT可能（お問い合わせフォーム用）
CREATE POLICY "誰でもお問い合わせを送信可能" ON contacts
  FOR INSERT WITH CHECK (true);

-- 認証ユーザーのみ参照可能（管理用）
CREATE POLICY "認証ユーザーのみお問い合わせを参照可能" ON contacts
  FOR SELECT USING (auth.role() = 'authenticated');
