-- コメント、プロフィール、リアクションを一度に取得する関数
CREATE OR REPLACE FUNCTION get_blog_comments_v2(blog_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(comment_data)
  INTO result
  FROM (
    SELECT
      c.*,
      p.name as user_name,
      p.avatar_url as user_avatar_url,
      COALESCE(
        (
          SELECT jsonb_agg(reaction_counts)
          FROM (
            SELECT
              emoji,
              count(*) as count,
              EXISTS(
                SELECT 1 FROM comment_reactions cr2
                WHERE cr2.comment_id = c.id AND cr2.emoji = cr.emoji AND cr2.user_id = auth.uid()
              ) as reacted
            FROM comment_reactions cr
            WHERE cr.comment_id = c.id
            GROUP BY emoji
          ) reaction_counts
        ),
        '[]'::jsonb
      ) as reactions
    FROM comments c
    LEFT JOIN profiles p ON c.user_id = p.id
    WHERE c.blog_id = blog_uuid
    ORDER BY c.created_at ASC
  ) comment_data;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;
