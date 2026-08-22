-- 修正: increment_view_count が updated_at を更新しないようにする
-- 閲覧数のインクリメントは「コンテンツの更新」ではないため、updated_at を変更すべきではない

CREATE OR REPLACE FUNCTION increment_view_count(blog_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE blogs
  SET view_count = view_count + 1
  WHERE id = blog_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
