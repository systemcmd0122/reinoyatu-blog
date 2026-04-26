import { createClient } from "@/utils/supabase/server";
import { decode } from "base64-arraybuffer";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import sharp from "sharp";

/**
 * 画像のハッシュ値を計算する
 */
export const calculateHash = (buffer: Buffer): string => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

/**
 * base64データをパースしてBufferとメタ情報を取得する
 */
export const parseBase64Image = (base64Image: string) => {
  const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("無効な画像データ形式です");
  }
  const contentType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");
  return { contentType, base64Data, buffer };
};

/**
 * 画像を最適化する (WebP変換、リサイズ)
 */
export const optimizeImage = async (buffer: Buffer, maxWidth = 1200): Promise<{ buffer: Buffer; contentType: string; extension: string }> => {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  // GIFの場合はアニメーションを保持するため最適化をスキップしてそのまま返す
  if (metadata.format === 'gif') {
    return {
      buffer,
      contentType: "image/gif",
      extension: "gif"
    };
  }

  let processor = image.webp({ quality: 80 });

  if (metadata.width && metadata.width > maxWidth) {
    processor = processor.resize(maxWidth);
  }

  const optimizedBuffer = await processor.toBuffer();
  return {
    buffer: optimizedBuffer,
    contentType: "image/webp",
    extension: "webp"
  };
};

/**
 * 認証チェックを行う
 */
export const validateUser = async () => {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("認証が必要です");
  }
  return user;
};
