-- 全ブログ記事を削除
-- 外部キー制約を持つテーブルから先に削除

-- 1. 関連テーブル
DELETE FROM comment_reactions;
DELETE FROM article_images;
DELETE FROM article_authors;
DELETE FROM collection_items;
DELETE FROM blog_tags;

-- 2. コンテンツ
DELETE FROM comments;
DELETE FROM likes;
DELETE FROM bookmarks;

-- 3. ブログ本体
DELETE FROM blogs;

-- 完了確認
SELECT 
  'blogs' as tbl, COUNT(*) as cnt FROM blogs
UNION ALL SELECT 'comments', COUNT(*) FROM comments
UNION ALL SELECT 'likes', COUNT(*) FROM likes
UNION ALL SELECT 'bookmarks', COUNT(*) FROM bookmarks
UNION ALL SELECT 'blog_tags', COUNT(*) FROM blog_tags
UNION ALL SELECT 'article_images', COUNT(*) FROM article_images
UNION ALL SELECT 'article_authors', COUNT(*) FROM article_authors
UNION ALL SELECT 'collection_items', COUNT(*) FROM collection_items
UNION ALL SELECT 'comment_reactions', COUNT(*) FROM comment_reactions;
