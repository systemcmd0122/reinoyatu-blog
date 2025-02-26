-- profilesテーブル作成
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  introduce text,
  avatar_url text
);

-- profilesテーブルRLS設定
alter table profiles enable row level security;
create policy "プロフィールは誰でも参照可能" on profiles for select using (true);
create policy "プロフィールを更新" on profiles for update using (true);

-- サインアップ時にプロフィールテーブル作成する関数
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- サインアップ時にプロフィールテーブル作成する関数を呼び出すトリガー
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- プロフィール画像のstorage作成
insert into storage.buckets (id, name, public) values ('profile', 'profile', true);
create policy "プロフィール画像は誰でも参照可能" on storage.objects for select using ( bucket_id = 'profile' );
create policy "プロフィール画像はログインユーザーが追加" on storage.objects for insert with check ( bucket_id = 'profile' AND auth.role() = 'authenticated' );
create policy "自身のプロフィール画像を更新" on storage.objects for update with check ( bucket_id = 'profile' AND auth.uid() = owner );
create policy "自身のプロフィール画像を削除" on storage.objects for delete using ( bucket_id = 'profile' AND auth.uid() = owner );

-- blogsテーブル作成
create table blogs (
  id uuid not null default uuid_generate_v4() primary key,
  user_id uuid not null references profiles(id),
  title text not null,
  content text not null,
  image_url text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- updated_atを自動で更新するトリガーの作成
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- blogsテーブルにトリガーを追加して、行が更新されるたびにupdated_atを更新
create trigger set_updated_at
before update on blogs
for each row
execute function update_updated_at_column();

-- blogsテーブルRLS設定
alter table blogs enable row level security;
create policy "ブログは誰でも参照可能" on blogs for select using ( true );
create policy "自身のブログを追加" on blogs for insert with check (auth.uid() = user_id);
create policy "自身のブログを更新" on blogs for update using (auth.uid() = user_id);
create policy "自身のブログを削除" on blogs for delete using (auth.uid() = user_id);

-- ブログのstorage作成
-- publicでstorageを作成する場合
insert into storage.buckets (id, name, public) values ('blogs', 'blogs', true);
create policy "画像は誰でも参照可能" on storage.objects for select using ( bucket_id = 'blogs' );
create policy "画像はログインユーザーが追加" on storage.objects for insert with check ( bucket_id = 'blogs' AND auth.role() = 'authenticated' );
create policy "自身の画像を更新" on storage.objects for update with check ( bucket_id = 'blogs' AND auth.uid() = owner );
create policy "自身の画像を削除" on storage.objects for delete using ( bucket_id = 'blogs' AND auth.uid() = owner );

-- likesテーブル作成
create table likes (
  id uuid not null default uuid_generate_v4() primary key,
  blog_id uuid not null references blogs(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- blog_idとuser_idの組み合わせは一意であるべき
  unique(blog_id, user_id)
);

-- likesテーブルRLS設定
alter table likes enable row level security;

-- likesテーブルのポリシー設定
create policy "いいねは誰でも参照可能" on likes for select using ( true );
create policy "自身のいいねを追加" on likes for insert with check (auth.uid() = user_id);
create policy "自身のいいねを削除" on likes for delete using (auth.uid() = user_id);

-- 便利のため、likesの数を返す関数を作成
create or replace function get_blog_likes_count(blog_id uuid)
returns integer as $$
  select count(*)::integer from likes where likes.blog_id = $1;
$$ language sql;

-- bookmarksテーブル作成
create table bookmarks (
  id uuid not null default uuid_generate_v4() primary key,
  blog_id uuid not null references blogs(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- blog_idとuser_idの組み合わせは一意であるべき
  unique(blog_id, user_id)
);

-- bookmarksテーブルRLS設定
alter table bookmarks enable row level security;

-- bookmarksテーブルのポリシー設定
create policy "ブックマークは誰でも参照可能" on bookmarks for select using ( true );
create policy "自身のブックマークを追加" on bookmarks for insert with check (auth.uid() = user_id);
create policy "自身のブックマークを削除" on bookmarks for delete using (auth.uid() = user_id);

-- 便利のため、ブログのブックマーク数を返す関数を作成
create or replace function get_blog_bookmarks_count(blog_id uuid)
returns integer as $$
  select count(*)::integer from bookmarks where bookmarks.blog_id = $1;
$$ language sql;

-- ユーザーのブックマーク済みブログを取得する関数を作成（オプション）
create or replace function get_user_bookmarks(user_uuid uuid)
returns setof blogs as $$
  select b.* from blogs b
  join bookmarks bm on b.id = bm.blog_id
  where bm.user_id = user_uuid
  order by bm.created_at desc;
$$ language sql;