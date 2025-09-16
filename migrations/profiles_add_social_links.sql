-- 既存のprofilesテーブルにソーシャルリンクとwebsite、emailカラムを追加
alter table profiles add column website text;
alter table profiles add column email text;
alter table profiles add column social_links jsonb default '{}'::jsonb;

-- social_linksのバリデーション用関数
create or replace function validate_social_links()
returns trigger as $$
begin
  -- social_linksがJSONBで、正しい形式かチェック
  if new.social_links is not null and not (
    jsonb_typeof(new.social_links) = 'object' and
    (new.social_links ? 'twitter' or not new.social_links ? 'twitter') and
    (new.social_links ? 'github' or not new.social_links ? 'github') and
    (new.social_links ? 'linkedin' or not new.social_links ? 'linkedin') and
    (new.social_links ? 'instagram' or not new.social_links ? 'instagram') and
    (new.social_links ? 'facebook' or not new.social_links ? 'facebook')
  ) then
    raise exception 'Invalid social_links format';
  end if;
  return new;
end;
$$ language plpgsql;

-- social_linksのバリデーション用トリガー
create trigger validate_social_links_trigger
  before insert or update on profiles
  for each row
  execute function validate_social_links();