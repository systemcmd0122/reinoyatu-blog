-- blog_tags テーブルへの操作時に、正確に該当ブログのみ updated_at を更新するトリガー

-- 既存のトリガーをクリーンアップ（存在する場合）
DROP TRIGGER IF EXISTS update_blog_updated_at_on_tag_change ON blog_tags CASCADE;

-- トリガー関数：blog_tags への操作時に、該当ブログのみ updated_at を更新
-- （共通タグを持つ他のブログは影響を受けない）
CREATE OR REPLACE FUNCTION update_blog_updated_at_on_tag_change()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT の場合：新しいタグを追加したブログのみ更新
  IF (TG_OP = 'INSERT') THEN
    UPDATE blogs
    SET updated_at = NOW()
    WHERE id = NEW.blog_id;
    RETURN NEW;
  -- DELETE の場合：タグを削除したブログのみ更新
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE blogs
    SET updated_at = NOW()
    WHERE id = OLD.blog_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- トリガーを作成：blog_tags への INSERT/DELETE 後に実行
CREATE TRIGGER update_blog_updated_at_on_tag_change
AFTER INSERT OR DELETE ON blog_tags
FOR EACH ROW
EXECUTE FUNCTION update_blog_updated_at_on_tag_change();

-- 注意：このトリガーは、blog_tags への操作が発生した際に、
-- 該当ブログ（NEW.blog_id または OLD.blog_id）のみ updated_at を更新します。
-- 共通タグを持つ他のブログの updated_at は更新されません。
