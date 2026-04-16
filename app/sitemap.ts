import { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createClient()

    // ブログ記事の取得
    const { data: blogs } = await supabase
        .from('blogs')
        .select('id, created_at, updated_at')
        .eq('is_published', true)

    const blogUrls = (blogs || []).map((blog) => ({
        url: `https://reinoyatu-blog.vercel.app/blog/${blog.id}`,
        lastModified: new Date(blog.updated_at || blog.created_at).toISOString().split('T')[0],
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    // 静的ページ
    const staticPages = [
        {
            url: 'https://reinoyatu-blog.vercel.app',
            lastModified: new Date().toISOString().split('T')[0],
            changeFrequency: 'daily' as const,
            priority: 1,
        },
        {
            url: 'https://reinoyatu-blog.vercel.app/about',
            lastModified: new Date().toISOString().split('T')[0],
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        },
        {
            url: 'https://reinoyatu-blog.vercel.app/privacy',
            lastModified: new Date().toISOString().split('T')[0],
            changeFrequency: 'monthly' as const,
            priority: 0.5,
        },
        {
            url: 'https://reinoyatu-blog.vercel.app/terms',
            lastModified: new Date().toISOString().split('T')[0],
            changeFrequency: 'monthly' as const,
            priority: 0.5,
        },
        {
            url: 'https://reinoyatu-blog.vercel.app/contact',
            lastModified: new Date().toISOString().split('T')[0],
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        },
    ]

    return [...staticPages, ...blogUrls]
}
