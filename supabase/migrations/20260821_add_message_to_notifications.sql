-- notifications テーブルに message カラムを追加
-- システム通知でメッセージ本文を保存するため
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;
