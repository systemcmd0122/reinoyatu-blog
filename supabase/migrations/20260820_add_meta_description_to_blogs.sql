-- blogs テーブルに meta_description カラムを追加
ALTER TABLE blogs ADD COLUMN meta_description TEXT;

-- 既存記事には NULL のまま（自動生成にフォールバック）
