-- blogs テーブルに slug カラムを追加
ALTER TABLE blogs ADD COLUMN slug TEXT UNIQUE;

-- 既存記事にスラッグを自動生成
DO $$
DECLARE
  blog_record RECORD;
  new_slug TEXT;
BEGIN
  FOR blog_record IN SELECT id, title FROM blogs WHERE slug IS NULL
  LOOP
    new_slug := lower(regexp_replace(
      regexp_replace(
        coalesce(blog_record.title, 'untitled'),
        '[^\w\u3040-\u9fff\u30a0-\u30ff\u3400-\u9fff-]', '-', 'g'
      ),
      '-+', '-', 'g'
    ));
    -- 重複を避けるためサフィックスを追加
    new_slug := trim(both '-' from new_slug) || '-' || substr(md5(random()::text), 1, 6);
    UPDATE blogs SET slug = new_slug WHERE id = blog_record.id;
  END LOOP;
END $$;

-- スラッグのインデックスを作成
CREATE INDEX idx_blogs_slug ON blogs(slug);

-- RLS ポリシー: slug は誰でも参照可能（既に blogs テーブルの RLS に従う）
