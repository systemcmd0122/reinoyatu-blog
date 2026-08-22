import React from "react"

interface ArticleJsonLdProps {
  title: string
  description: string
  url: string
  image?: string
  datePublished: string
  dateModified?: string
  authorName: string
  authorUrl?: string
  siteName?: string
  tags?: string[]
  timeRequired?: string
}

export function ArticleJsonLd({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  authorName,
  authorUrl,
  siteName = "例のヤツ｜ブログ",
  tags,
  timeRequired,
}: ArticleJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    url,
    image: image || undefined,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      "@type": "Person",
      name: authorName,
      url: authorUrl || undefined,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
    },
    keywords: tags?.join(", ") || undefined,
    timeRequired: timeRequired || undefined,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

interface OrganizationJsonLdProps {
  name: string
  url: string
  logo?: string
}

export function OrganizationJsonLd({
  name,
  url,
  logo,
}: OrganizationJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo: logo || undefined,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

interface WebSiteJsonLdProps {
  name: string
  url: string
  searchUrl?: string
}

export function WebSiteJsonLd({ name, url, searchUrl }: WebSiteJsonLdProps) {
  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
  }

  if (searchUrl) {
    jsonLd.potentialAction = {
      "@type": "SearchAction",
      target: searchUrl,
      "query-input": "required name=search_term_string",
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

interface ItemListJsonLdProps {
  name: string
  description?: string
  url: string
  items: {
    name: string
    url: string
    position: number
    image?: string
    description?: string
  }[]
}

export function ItemListJsonLd({ name, description, url, items }: ItemListJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    description: description || undefined,
    url,
    itemListElement: items.map(item => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      url: item.url,
      image: item.image || undefined,
      description: item.description || undefined,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

interface PersonJsonLdProps {
  name: string
  url: string
  image?: string
  description?: string
  sameAs?: string[]
  jobTitle?: string
}

export function PersonJsonLd({ name, url, image, description, sameAs, jobTitle }: PersonJsonLdProps) {
  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url,
    image: image || undefined,
    description: description || undefined,
    sameAs: sameAs || undefined,
    jobTitle: jobTitle || undefined,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbListJsonLdProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbListJsonLd({ items }: BreadcrumbListJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
