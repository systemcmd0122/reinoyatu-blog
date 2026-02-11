-- imagesテーブル作成
create table if not exists images (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  storage_path text not null unique,
  public_url text not null,
  hash text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- hashにインデックスを作成
create index if not exists idx_images_hash on images(hash);

-- article_imagesテーブル作成（中間テーブル）
create table if not exists article_images (
  article_id uuid references blogs(id) on delete cascade not null,
  image_id uuid references images(id) on delete cascade not null,
  primary key (article_id, image_id)
);

-- RLS設定
alter table images enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where policyname = '画像は誰でも参照可能' and tablename = 'images') then
    create policy "画像は誰でも参照可能" on images for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = '自身の画像を管理' and tablename = 'images') then
    create policy "自身の画像を管理" on images for all using (auth.uid() = user_id);
  end if;
end
$$;

alter table article_images enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where policyname = '記事画像は誰でも参照可能' and tablename = 'article_images') then
    create policy "記事画像は誰でも参照可能" on article_images for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = '自身の記事画像を管理' and tablename = 'article_images') then
    create policy "自身の記事画像を管理" on article_images for all using (
      exists (
        select 1 from blogs where id = article_id and user_id = auth.uid()
      )
    );
  end if;
end
$$;
