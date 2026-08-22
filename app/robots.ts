import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/settings/',
        '/notifications/',
        '/bookmarks/',
        '/api/',
        '/auth/',
        '/blog/new',
        '/blog/ai-new',
        '/blog/*/edit',
        '/debug/',
        '/offline',
      ],
    },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://reinoyatu-blog.vercel.app'}/sitemap.xml`,
  }
}
