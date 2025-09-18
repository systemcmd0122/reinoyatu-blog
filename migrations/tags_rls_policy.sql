-- 1. tagsテーブルのRLSを有効にする
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーがあれば削除（念のため）
DROP POLICY IF EXISTS "Allow public read access to tags" ON public.tags;
DROP POLICY IF EXISTS "Allow authenticated users to insert tags" ON public.tags;

-- 3. 公開読み取りアクセスを許可するポリシー
-- これにより、誰でもタグを閲覧できるようになります。
CREATE POLICY "Allow public read access to tags"
ON public.tags
FOR SELECT
USING (true);

-- 4. 認証済みユーザーによる挿入を許可するポリシー
-- これにより、ログインしているユーザーは新しいタグを作成できるようになります。
CREATE POLICY "Allow authenticated users to insert tags"
ON public.tags
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
