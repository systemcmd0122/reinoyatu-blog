const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// 環境変数が設定されていることを前提とします
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // サービスロールキー推奨

if (!supabaseUrl || !supabaseKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください。');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('--- 過去画像の移行を開始します ---');

  // 1. Storage内の全ファイルをリストアップ
  // 注: ユーザーごとのフォルダ分けを考慮する必要があります
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.error('Bucket取得エラー:', bucketError);
    return;
  }

  const bucketName = 'blogs';
  console.log(`Bucket '${bucketName}' をスキャン中...`);

  // 再帰的にファイルをリストアップする関数
  async function listAllFiles(path = '') {
    const { data, error } = await supabase.storage.from(bucketName).list(path);
    if (error) throw error;

    let files = [];
    for (const item of data) {
      const fullPath = path ? `${path}/${item.name}` : item.name;
      if (item.id === null) {
        // ディレクトリ
        const subFiles = await listAllFiles(fullPath);
        files = files.concat(subFiles);
      } else {
        // ファイル
        files.push({ ...item, fullPath });
      }
    }
    return files;
  }

  const storageFiles = await listAllFiles();
  console.log(`${storageFiles.length} 個のファイルが見つかりました。`);

  // 2. 各ファイルのハッシュを計算し、imagesテーブルに登録
  for (const file of storageFiles) {
    console.log(`処理中: ${file.fullPath}`);

    // ファイルをダウンロード
    const { data: blob, error: downloadError } = await supabase.storage.from(bucketName).download(file.fullPath);
    if (downloadError) {
      console.error(`  ダウンロードエラー (${file.fullPath}):`, downloadError.message);
      continue;
    }

    // ハッシュ計算
    const buffer = Buffer.from(await blob.arrayBuffer());
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // 公開URLを取得
    const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(file.fullPath);

    // imagesテーブルに登録（すでにある場合は既存のものを使用）
    // userIdを特定する必要があります。storage_pathが 'userId/fileName' の形式であることを想定。
    const userId = file.fullPath.split('/')[0];

    const { data: imageRecord, error: upsertError } = await supabase
      .from('images')
      .upsert({
        user_id: userId,
        storage_path: file.fullPath,
        public_url: publicUrl,
        hash: hash
      }, { onConflict: 'hash' })
      .select()
      .single();

    if (upsertError) {
      console.error(`  imagesテーブル登録エラー (${file.fullPath}):`, upsertError.message);
    } else {
      console.log(`  登録成功 (ID: ${imageRecord.id})`);
    }
  }

  // 3. 全ブログ記事をスキャンし、article_imagesを構築
  console.log('\n記事との紐付け（article_images）を作成中...');
  const { data: blogs, error: blogError } = await supabase.from('blogs').select('id, image_url, content_json');
  if (blogError) {
    console.error('ブログ取得エラー:', blogError);
    return;
  }

  for (const blog of blogs) {
    console.log(`記事 ID: ${blog.id} を処理中...`);
    const urls = new Set();
    if (blog.image_url) urls.add(blog.image_url);

    if (blog.content_json) {
      try {
        const json = JSON.parse(blog.content_json);
        const extractImages = (node) => {
          if (node.type === 'image' && node.attrs?.src) urls.add(node.attrs.src);
          if (node.content && Array.isArray(node.content)) node.content.forEach(extractImages);
        };
        extractImages(json);
      } catch (e) {}
    }

    if (urls.size > 0) {
      const { data: images } = await supabase.from('images').select('id').in('public_url', Array.from(urls));
      if (images && images.length > 0) {
        const relations = images.map(img => ({ article_id: blog.id, image_id: img.id }));
        const { error: relError } = await supabase.from('article_images').upsert(relations, { onConflict: 'article_id,image_id' });
        if (relError) console.error(`  紐付けエラー:`, relError.message);
        else console.log(`  ${images.length} 個の画像を紐付けました。`);
      }
    }
  }

  console.log('--- 移行が完了しました ---');
}

migrate();
