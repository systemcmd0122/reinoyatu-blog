import { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createClient()

    // ブログ記事の取得（スラッグ優先、フォールバックでUUID）
    const { data: blogs } = await supabase
        .from('blogs')
        .select('id, slug, created_at, updated_at')
        .eq('is_published', true)

    const blogUrls = (blogs || []).map((blog) => ({
        url: `https://reinoyatu-blog.vercel.app/blog/${blog.slug || blog.id}`,
        lastModified: new Date(blog.updated_at || blog.created_at).toISOString().split('T')[0],
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    // タグページ
    const { data: tags } = await supabase
        .from('tags')
        .select('name')

    const tagUrls = (tags || []).map((tag) => ({
        url: `https://reinoyatu-blog.vercel.app/tags/${encodeURIComponent(tag.name)}`,
        lastModified: new Date().toISOString().split('T')[0],
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    }))

    // コレクションページ（公開のみ）
    const { data: collections } = await supabase
        .from('collections')
        .select('id, updated_at, created_at')
        .eq('is_public', true)

    const collectionUrls = (collections || []).map((collection) => ({
        url: `https://reinoyatu-blog.vercel.app/collections/${collection.id}`,
        lastModified: new Date(collection.updated_at || collection.created_at).toISOString().split('T')[0],
        changeFrequency: 'weekly' as const,
        priority: 0.7,
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

    return [...staticPages, ...blogUrls, ...tagUrls, ...collectionUrls]
}
