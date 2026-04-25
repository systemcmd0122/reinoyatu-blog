import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/settings/',
        '/notifications/',
        '/api/',
        '/auth/',
        '/blog/new',
        '/blog/*/edit',
      ],
    },
    sitemap: 'https://reinoyatu-blog.vercel.app/sitemap.xml',
  }
}
