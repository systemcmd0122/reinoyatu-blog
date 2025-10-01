/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  generateRobotsTxt: true,
  exclude: ['/auth/*', '/settings/*'],
  generateIndexSitemap: false,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/auth/*', '/settings/*']
      }
    ]
  }
}