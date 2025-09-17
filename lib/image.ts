export const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#333" offset="20%" />
      <stop stop-color="#222" offset="50%" />
      <stop stop-color="#333" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#333" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`

export const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)

export const resizeImage = async (
  base64Image: string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Image;

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // アスペクト比を維持しながらリサイズ
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context is not available'));
        return;
      }

      // 画質を改善するためのオプション
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(img, 0, 0, width, height);

      // 画像形式を自動判定
      const mimeType = base64Image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      resolve(canvas.toDataURL(mimeType, quality));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
  });
};

export const validateImageDimensions = async (base64Image: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Image;

    img.onload = () => {
      // 最小サイズ: 200x200、最大サイズ: 2000x2000
      resolve(
        img.width >= 200 &&
        img.height >= 200 &&
        img.width <= 2000 &&
        img.height <= 2000
      );
    };

    img.onerror = () => {
      resolve(false);
    };
  });
};