-- profilesテーブルにai_settingsカラムを追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_settings JSONB DEFAULT '{}'::jsonb;
