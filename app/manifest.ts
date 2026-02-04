import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '例のヤツ｜ブログ',
    short_name: '例のヤツ',
    description: 'あなたのアイデア、ストーリー、専門知識を共有し、世界と繋がるプラットフォーム。',
    start_url: '/',
    display: 'standalone',
    scope: '/',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    display_override: ['standalone', 'minimal-ui'],
    categories: ['blog', 'social', 'productivity'],
    lang: 'ja',
    dir: 'ltr',
    icons: [
      {
        src: '/icon.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon.png',
        sizes: '256x256',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/maskable-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/og-image.png',
        sizes: '1200x630',
        type: 'image/png',
        form_factor: 'wide',
      }
    ],
    shortcuts: [
      {
        name: 'ホーム',
        short_name: 'ホーム',
        description: 'ホームページを開く',
        url: '/',
        icons: [{ src: '/icon.png', sizes: '192x192' }],
      },
      {
        name: '新しい記事',
        short_name: '記事作成',
        description: '新しいブログ記事を作成',
        url: '/blog/new',
        icons: [{ src: '/icon.png', sizes: '192x192' }],
      },
      {
        name: 'ブックマーク',
        short_name: 'ブックマーク',
        description: 'ブックマークした記事を見る',
        url: '/bookmarks',
        icons: [{ src: '/icon.png', sizes: '192x192' }],
      },
    ],
    prefer_related_applications: false,
  }
}