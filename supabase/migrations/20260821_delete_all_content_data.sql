-- ============================================================
-- 全コンテンツデータ削除マイグレーション
-- ユーザー認証情報(auth.users)とプロフィール(profiles)は保持
-- ============================================================

-- 外部キー制約を一時的に無効にして削除順序を考慮
-- 1. 関連テーブル（参照される側）
DELETE FROM comment_reactions;
DELETE FROM article_images;
DELETE FROM article_authors;
DELETE FROM collection_items;
DELETE FROM blog_tags;

-- 2. コンテンツテーブル
DELETE FROM comments;
DELETE FROM likes;
DELETE FROM bookmarks;
DELETE FROM notifications;
DELETE FROM contacts;

-- 3. メインコンテンツ
DELETE FROM blogs;
DELETE FROM tags;
DELETE FROM collections;
DELETE FROM images;

-- 4. リレーションシップ
DELETE FROM user_follows;
-- follows テーブルが存在する場合
DELETE FROM follows;

-- 5. プロフィールの的社会リンク・自己紹介は保持（ユーザー情報の一部）
-- profiles テーブルは削除しない

-- 6. 全ユーザーにシステムお知らせ通知を送信
-- （次のステップでアプリ側から送信する）

-- 完了確認用
SELECT 
  'blogs' as tbl, COUNT(*) as cnt FROM blogs
UNION ALL SELECT 'comments', COUNT(*) FROM comments
UNION ALL SELECT 'likes', COUNT(*) FROM likes
UNION ALL SELECT 'bookmarks', COUNT(*) FROM bookmarks
UNION ALL SELECT 'tags', COUNT(*) FROM tags
UNION ALL SELECT 'blog_tags', COUNT(*) FROM blog_tags
UNION ALL SELECT 'collections', COUNT(*) FROM collections
UNION ALL SELECT 'collection_items', COUNT(*) FROM collection_items
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'contacts', COUNT(*) FROM contacts
UNION ALL SELECT 'images', COUNT(*) FROM images
UNION ALL SELECT 'article_images', COUNT(*) FROM article_images
UNION ALL SELECT 'article_authors', COUNT(*) FROM article_authors
UNION ALL SELECT 'comment_reactions', COUNT(*) FROM comment_reactions
UNION ALL SELECT 'user_follows', COUNT(*) FROM user_follows
UNION ALL SELECT 'profiles', COUNT(*) FROM profiles;
