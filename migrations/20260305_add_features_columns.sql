-- 記事の閲覧数カラムを追加
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- プロフィールのヘッダー画像URLカラムを追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS header_image_url TEXT;

-- 閲覧数をインクリメントする関数
CREATE OR REPLACE FUNCTION increment_view_count(blog_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE blogs
  SET view_count = view_count + 1
  WHERE id = blog_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
