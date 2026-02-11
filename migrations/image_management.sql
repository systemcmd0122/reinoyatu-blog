-- imagesテーブル作成
create table images (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  storage_path text not null unique,
  public_url text not null,
  hash text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- hashにインデックスを作成
create index idx_images_hash on images(hash);

-- article_imagesテーブル作成（中間テーブル）
create table article_images (
  article_id uuid references blogs(id) on delete cascade not null,
  image_id uuid references images(id) on delete cascade not null,
  primary key (article_id, image_id)
);

-- RLS設定
alter table images enable row level security;
create policy "画像は誰でも参照可能" on images for select using (true);
create policy "自身の画像を管理" on images for all using (auth.uid() = user_id);

alter table article_images enable row level security;
create policy "記事画像は誰でも参照可能" on article_images for select using (true);
create policy "自身の記事画像を管理" on article_images for all using (
  exists (
    select 1 from blogs where id = article_id and user_id = auth.uid()
  )
);
