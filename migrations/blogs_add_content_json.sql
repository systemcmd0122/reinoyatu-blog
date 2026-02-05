-- blogsテーブルにcontent_jsonカラムを追加
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS content_json JSONB;

-- コメントを追加
COMMENT ON COLUMN blogs.content_json IS 'Editor AST in JSON format';
