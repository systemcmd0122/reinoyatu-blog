-- タイムスタンプカラムの追加
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- インデックスの追加
CREATE INDEX profiles_name_idx ON profiles (name);
CREATE INDEX profiles_created_at_idx ON profiles (created_at);
CREATE INDEX blogs_user_id_idx ON blogs (user_id);

-- social_links カラムのバリデーション強化
CREATE OR REPLACE FUNCTION validate_social_links()
RETURNS trigger AS $$
BEGIN
  -- social_linksがJSONBで、正しい形式かチェック
  IF NEW.social_links IS NOT NULL AND NOT (
    jsonb_typeof(NEW.social_links) = 'object' AND
    (
      NOT (NEW.social_links ? 'twitter') OR 
      (NEW.social_links->>'twitter' ~ '^https?://[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/.*$')
    ) AND
    (
      NOT (NEW.social_links ? 'github') OR 
      (NEW.social_links->>'github' ~ '^https?://[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/.*$')
    ) AND
    (
      NOT (NEW.social_links ? 'linkedin') OR 
      (NEW.social_links->>'linkedin' ~ '^https?://[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/.*$')
    ) AND
    (
      NOT (NEW.social_links ? 'instagram') OR 
      (NEW.social_links->>'instagram' ~ '^https?://[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/.*$')
    ) AND
    (
      NOT (NEW.social_links ? 'facebook') OR 
      (NEW.social_links->>'facebook' ~ '^https?://[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/.*$')
    )
  ) THEN
    RAISE EXCEPTION 'Invalid social links format';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成/更新
DROP TRIGGER IF EXISTS validate_social_links_trigger ON profiles;
CREATE TRIGGER validate_social_links_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION validate_social_links();

-- RLSポリシーの更新
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "プロフィールは誰でも参照可能" ON profiles;
DROP POLICY IF EXISTS "プロフィールを更新" ON profiles;

CREATE POLICY "プロフィールは誰でも参照可能" ON profiles
FOR SELECT USING (true);

CREATE POLICY "プロフィールを更新" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "プロフィールを作成" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 更新日時を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 更新日時トリガーの作成
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- インデックスの最適化
ANALYZE profiles;