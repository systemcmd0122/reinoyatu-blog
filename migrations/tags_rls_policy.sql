-- タグ関連テーブルのセキュリティ設定

-- 1. created_byカラムの追加（存在しない場合のみ）
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tags' 
    AND column_name = 'created_by'
  ) THEN
    -- タグ作成者を記録するカラムを追加
    ALTER TABLE public.tags
    ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- 2. テーブルごとの行レベルセキュリティ（RLS）を有効化
-- タグテーブルのRLS有効化
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- タグとブログの関連テーブルのRLS有効化
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;

-- 2. 既存のセキュリティポリシーをクリーンアップ（安全のため）
-- タグテーブルの既存ポリシーを削除
DROP POLICY IF EXISTS "タグの公開読み取りを許可" ON public.tags;
DROP POLICY IF EXISTS "認証済みユーザーのタグ作成を許可" ON public.tags;
DROP POLICY IF EXISTS "タグ作成者の更新を許可" ON public.tags;
DROP POLICY IF EXISTS "タグ作成者の削除を許可" ON public.tags;

-- タグ関連テーブルの既存ポリシーを削除
DROP POLICY IF EXISTS "タグ関連の公開読み取りを許可" ON public.blog_tags;
DROP POLICY IF EXISTS "ブログ作成者のタグ関連付けを許可" ON public.blog_tags;
DROP POLICY IF EXISTS "ブログ作成者のタグ関連削除を許可" ON public.blog_tags;

-- 3. タグテーブル（public.tags）のセキュリティポリシー設定
-- 3-1. 誰でもタグを閲覧可能
CREATE POLICY "タグの公開読み取りを許可"
ON public.tags
FOR SELECT
TO PUBLIC
USING (true);

-- 3-2. ログインユーザーのみタグ作成可能
CREATE POLICY "認証済みユーザーのタグ作成を許可"
ON public.tags
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- 3-3. タグ作成者のみが更新可能
CREATE POLICY "タグ作成者の更新を許可"
ON public.tags
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- 3-4. タグ作成者のみが削除可能
CREATE POLICY "タグ作成者の削除を許可"
ON public.tags
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- 4. タグ関連テーブル（public.blog_tags）のセキュリティポリシー設定
-- 4-1. 誰でもタグの関連付けを閲覧可能
CREATE POLICY "タグ関連の公開読み取りを許可"
ON public.blog_tags
FOR SELECT
TO PUBLIC
USING (true);

-- 4-2. ブログ作成者のみがタグを関連付け可能
CREATE POLICY "ブログ作成者のタグ関連付けを許可"
ON public.blog_tags
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.blogs
    WHERE id = blog_id
    AND user_id = auth.uid()
  )
);

-- 4-3. ブログ作成者のみが関連付けを削除可能
CREATE POLICY "ブログ作成者のタグ関連削除を許可"
ON public.blog_tags
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.blogs
    WHERE id = blog_id
    AND user_id = auth.uid()
  )
);

-- 注: created_byカラムは冒頭で追加済み
