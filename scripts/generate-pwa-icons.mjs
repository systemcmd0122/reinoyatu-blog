import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const iconDir = join(process.cwd(), 'public', 'icons');
const sourceIcon = join(process.cwd(), 'public', 'icon.png');
const sourceMaskable = join(process.cwd(), 'public', 'maskable-icon.png');

if (!existsSync(iconDir)) {
  mkdirSync(iconDir, { recursive: true });
}

const sizes = [192, 512];

async function generate() {
  try {
    for (const size of sizes) {
      // Regular icon (any)
      // We use 'contain' to ensure the non-square source fits in a square without distortion
      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .toFile(join(iconDir, `icon-${size}x${size}.png`));

      // Maskable icon
      // Maskable icons need to fill the safe area.
      // Since the source is nearly square (1000x905), we can use 'cover' or 'contain' with background.
      // Usually maskable icons look better if they have some "breathing room" (padding).
      // We'll resize to 80% of the target size and then extend to the full size with background.
      const paddingSize = Math.floor(size * 0.8);
      await sharp(sourceMaskable)
        .resize(paddingSize, paddingSize, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .extend({
          top: Math.floor((size - paddingSize) / 2),
          bottom: size - paddingSize - Math.floor((size - paddingSize) / 2),
          left: Math.floor((size - paddingSize) / 2),
          right: size - paddingSize - Math.floor((size - paddingSize) / 2),
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .toFile(join(iconDir, `maskable-icon-${size}x${size}.png`));

      console.log(`Generated icons for ${size}x${size}`);
    }
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generate();
