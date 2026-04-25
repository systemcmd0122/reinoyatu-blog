-- 1. profilesテーブルの更新
-- すでにカラムが存在する可能性を考慮し、IF NOT EXISTS的な処理、あるいは既存の確認
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS header_image_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS homepage_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL;

-- カラムの制約更新（既存のデータにNo NameをセットしてからNOT NULLにする例）
UPDATE profiles SET name = 'No Name' WHERE name IS NULL;
ALTER TABLE profiles ALTER COLUMN name SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN name SET DEFAULT 'No Name';

-- 2. RLSポリシーの修正
DROP POLICY IF EXISTS "プロフィールを更新" ON profiles;
CREATE POLICY "プロフィールを更新" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 3. サインアップ時のプロフィール作成関数の更新
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'No Name'), new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. インデックスの追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_blogs_user_id ON blogs(user_id);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_blog_id ON likes(blog_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_blog_id ON comments(blog_id);
