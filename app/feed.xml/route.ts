import { createClient } from "@/utils/supabase/server"

export const runtime = "edge"

export async function GET() {
  const supabase = createClient()
  const baseUrl = "https://reinoyatu-blog.vercel.app"

  const { data: blogs } = await supabase
    .from("blogs")
    .select(`
      id,
      slug,
      title,
      content,
      summary,
      meta_description,
      image_url,
      created_at,
      updated_at,
      profiles!user_id (name, avatar_url)
    `)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(50)

  const { data: tags } = await supabase
    .from("tags")
    .select("name")

  const siteName = "例のヤツ｜ブログ"
  const siteDescription = "AI×WebGPUで動く次世代ブログプラットフォーム"
  const now = new Date().toISOString()

  const items = (blogs || []).map((blog) => {
    const slug = blog.slug || blog.id
    const url = `${baseUrl}/blog/${slug}`
    const description = blog.meta_description || blog.summary || (blog.content || "").replace(/[#*`>\[\]()!]/g, "").slice(0, 200)
    const author = (blog.profiles as any)?.name || "匿名"
    const pubDate = new Date(blog.created_at).toUTCString()
    const updateDate = blog.updated_at ? new Date(blog.updated_at).toUTCString() : pubDate

    return `    <item>
      <title><![CDATA[${blog.title || "無題の記事"}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description><![CDATA[${description}]]></description>
      <dc:creator><![CDATA[${author}]]></dc:creator>
      <pubDate>${pubDate}</pubDate>
      <lastBuildDate>${updateDate}</lastBuildDate>
      ${blog.image_url ? `<enclosure url="${blog.image_url}" type="image/jpeg" />` : ""}
    </item>`
  }).join("\n")

  const tagCategories = (tags || []).map((tag) =>
    `    <category>${tag.name}</category>`
  ).join("\n")

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteName}</title>
    <link>${baseUrl}</link>
    <description>${siteDescription}</description>
    <language>ja</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
${tagCategories}
${items}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
