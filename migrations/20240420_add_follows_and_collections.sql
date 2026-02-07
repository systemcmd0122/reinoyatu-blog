-- user_followsテーブル作成
create table user_follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- user_follows RLS設定
alter table user_follows enable row level security;
create policy "フォロー情報は誰でも参照可能" on user_follows for select using (true);
create policy "自身のフォローを追加" on user_follows for insert with check (auth.uid() = follower_id);
create policy "自身のフォローを解除" on user_follows for delete using (auth.uid() = follower_id);

-- collectionsテーブル作成
create table collections (
  id uuid not null default uuid_generate_v4() primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  is_public boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- collection_itemsテーブル作成
create table collection_items (
  id uuid not null default uuid_generate_v4() primary key,
  collection_id uuid not null references collections(id) on delete cascade,
  blog_id uuid not null references blogs(id) on delete cascade,
  order_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(collection_id, blog_id)
);

-- updated_at更新トリガーの適用
create trigger set_collection_updated_at
before update on collections
for each row
execute function update_updated_at_column();

-- collections RLS設定
alter table collections enable row level security;
create policy "公開コレクションは誰でも参照可能" on collections for select using (is_public = true or auth.uid() = user_id);
create policy "自身のコレクションを追加" on collections for insert with check (auth.uid() = user_id);
create policy "自身のコレクションを更新" on collections for update using (auth.uid() = user_id);
create policy "自身のコレクションを削除" on collections for delete using (auth.uid() = user_id);

-- collection_items RLS設定
alter table collection_items enable row level security;
create policy "コレクションアイテムは関連するコレクションの権限に従う" on collection_items for select using (
  exists (
    select 1 from collections where id = collection_items.collection_id and (is_public = true or auth.uid() = user_id)
  )
);
create policy "自身のコレクションにアイテムを追加" on collection_items for insert with check (
  exists (
    select 1 from collections where id = collection_items.collection_id and auth.uid() = user_id
  )
);
create policy "自身のコレクションのアイテムを更新" on collection_items for update using (
  exists (
    select 1 from collections where id = collection_items.collection_id and auth.uid() = user_id
  )
);
create policy "自身のコレクションからアイテムを削除" on collection_items for delete using (
  exists (
    select 1 from collections where id = collection_items.collection_id and auth.uid() = user_id
  )
);

-- 便利関数の追加
create or replace function get_user_follow_counts(user_uuid uuid)
returns table (following_count bigint, follower_count bigint) as $$
begin
  return query
  select
    (select count(*) from user_follows where follower_id = user_uuid) as following_count,
    (select count(*) from user_follows where following_id = user_uuid) as follower_count;
end;
$$ language plpgsql;
