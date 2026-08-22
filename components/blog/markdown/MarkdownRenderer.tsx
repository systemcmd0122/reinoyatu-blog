"use client"

import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import dynamic from "next/dynamic"
import { Clipboard, Check, ExternalLink, XCircle, AlertCircle, Info, CheckCircle, AlertTriangle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import YouTubeEmbed from "./YouTubeEmbed"
import IframeEmbed from "./IframeEmbed"
import Callout from "./Callout"
import Accordion from "./Accordion"
import { Timeline, TimelineItem } from "./Timeline"
import ProgressBar from "./ProgressBar"

import "katex/dist/katex.min.css"

const CodeBlock = dynamic(() => import("./CodeBlock"), { ssr: false })

interface MarkdownRendererProps {
  content: string
  className?: string
  enableMath?: boolean
  enableRaw?: boolean
}

interface CodeProps {
  inline?: boolean
  className?: string
  children?: React.ReactNode
  [key: string]: any
}

interface ImageProps {
  src?: string | any
  alt?: string
  title?: string
}

interface YouTubeMatch {
  index: number
  videoId: string
  showDetails: boolean
}

interface IframeMatch {
  index: number
  src: string
}

// 日本語を含む文字列から安全なIDを生成
function toHeadingId(text: React.ReactNode): string {
  const str = typeof text === "string"
    ? text
    : Array.isArray(text)
      ? text.map(n => (typeof n === "string" ? n : "")).join("")
      : ""
  return str
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u3040-\u9fff\u30a0-\u30ff\-]/g, "")
    .toLowerCase()
}

// インラインコード
const InlineCode: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <code
    className="not-prose"
    style={{
      fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, Menlo, Monaco, Consolas, monospace',
      fontSize: "0.875em",
      fontWeight: 500,
      padding: "0.15em 0.4em",
      borderRadius: "4px",
      background: "hsl(var(--muted) / 0.8)",
      border: "1px solid hsl(var(--border) / 0.5)",
      color: "hsl(var(--foreground))",
      wordBreak: "break-word",
    }}
  >
    {children}
  </code>
)

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
  enableRaw = true,
}) => {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  // YouTube埋め込みの抽出
  const extractYouTubeEmbeds = (markdownContent: string) => {
    const matches: YouTubeMatch[] = []
    if (!markdownContent) return { content: "", matches }
    const processed = markdownContent.replace(
      /\{\{youtube:([^:}]+)(?::showDetails=(true|false))?\}\}/g,
      (_, videoId, showDetailsStr) => {
        const index = matches.length
        matches.push({
          index,
          videoId: (videoId || "").trim(),
          showDetails: showDetailsStr !== "false",
        })
        return `YOUTUBE_EMBED_${index}_PLACEHOLDER`
      }
    )
    return { content: processed, matches }
  }

  // iframe埋め込みの抽出
  const extractIframeEmbeds = (markdownContent: string) => {
    const matches: IframeMatch[] = []
    if (!markdownContent) return { content: "", matches }
    const processed = markdownContent.replace(
      /\{\{iframe:([^}]+)\}\}/g,
      (_, src) => {
        const index = matches.length
        matches.push({ index, src: (src || "").trim() })
        return `IFRAME_EMBED_${index}_PLACEHOLDER`
      }
    )
    return { content: processed, matches }
  }

  const { content: withYoutube, matches: youtubeMatches } = extractYouTubeEmbeds(content || "")
  const { content: processedContent, matches: iframeMatches } = extractIframeEmbeds(withYoutube)

  const handleImageError = (src: string) => {
    setImageErrors(prev => new Set(prev).add(src))
  }

  // 段落内のプレースホルダーを埋め込みコンポーネントに変換
  const processTextWithEmbeds = (text: string): React.ReactNode => {
    const parts = text.split(/(YOUTUBE_EMBED_\d+_PLACEHOLDER|IFRAME_EMBED_\d+_PLACEHOLDER)/)
    if (parts.length === 1) return text

    return parts.map((part, i) => {
      const ytMatch = part.match(/YOUTUBE_EMBED_(\d+)_PLACEHOLDER/)
      if (ytMatch) {
        const data = youtubeMatches[parseInt(ytMatch[1], 10)]
        return data
          ? <YouTubeEmbed key={`yt-${i}`} videoId={data.videoId} showDetails={data.showDetails} />
          : null
      }
      const ifMatch = part.match(/IFRAME_EMBED_(\d+)_PLACEHOLDER/)
      if (ifMatch) {
        const data = iframeMatches[parseInt(ifMatch[1], 10)]
        return data ? <IframeEmbed key={`if-${i}`} src={data.src} /> : null
      }
      return part
    })
  }

  // Qwen などの思考モデルが出力する <think> を安全に表示するためのコンポーネント
  const ThinkBlock = ({ children }: { children?: React.ReactNode }) => (
    <div className="not-prose my-4 rounded-lg border border-dashed border-border/60 bg-muted/30 px-4 py-3">
      <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
        思考
      </span>
      <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none text-muted-foreground">
        {children}
      </div>
    </div>
  )

  return (
    <div
      className={`
        article-markdown
        prose prose-zinc dark:prose-invert
        max-w-none
        ${className}
      `}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
        rehypePlugins={[
          rehypeKatex,
          ...(enableRaw ? [[rehypeRaw, { tagfilter: true }] as any] : []),
        ]}
        components={{
          // ─── コード ───────────────────────────────────
          code({ inline, className: cls, children, ...props }: CodeProps) {
            const match = /language-(\w+)/.exec(cls || "")
            const codeStr = String(children).replace(/\n$/, "")

            // インラインコード（`code`）
            if (inline || (!match && !codeStr.includes("\n"))) {
              return <InlineCode>{children}</InlineCode>
            }

            // コードブロック（```lang```）
            return <CodeBlock language={match?.[1]} code={codeStr} />
          },

          // ─── 見出し（日本語対応ID）──────────────────
          h1({ children }) {
            const id = toHeadingId(children)
            return (
              <h1 id={id} className="scroll-mt-24">
                {children}
              </h1>
            )
          },
          h2({ children }) {
            const id = toHeadingId(children)
            return (
              <h2 id={id} className="scroll-mt-24">
                {children}
              </h2>
            )
          },
          h3({ children }) {
            const id = toHeadingId(children)
            return (
              <h3 id={id} className="scroll-mt-24">
                {children}
              </h3>
            )
          },
          h4({ children }) {
            const id = toHeadingId(children)
            return (
              <h4 id={id} className="scroll-mt-24">
                {children}
              </h4>
            )
          },
          h5({ children }) {
            return <h5 className="scroll-mt-24">{children}</h5>
          },
          h6({ children }) {
            return <h6 className="scroll-mt-24">{children}</h6>
          },

          // ─── 段落（埋め込み対応）────────────────────
          p({ children }) {
            const processChildren = (nodes: React.ReactNode): React.ReactNode => {
              if (!nodes) return null
              if (typeof nodes === "string") {
                return processTextWithEmbeds(nodes)
              }
              if (Array.isArray(nodes)) {
                return nodes.map((n, i) =>
                  typeof n === "string"
                    ? <React.Fragment key={i}>{processTextWithEmbeds(n)}</React.Fragment>
                    : n
                )
              }
              return nodes
            }
            const processed = Array.isArray(children)
              ? children.map((c, i) => <React.Fragment key={i}>{processChildren(c)}</React.Fragment>)
              : processChildren(children)

            return <p>{processed}</p>
          },

          // ─── リンク ────────────────────────────────
          a({ href, children }) {
            const isExternal = href?.startsWith("http")
            if (!isExternal && href) {
              return (
                <Link href={href} className="text-primary font-medium underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-all">
                  {children}
                </Link>
              )
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-all inline-flex items-center gap-0.5"
              >
                {children}
                <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-60" />
              </a>
            )
          },

          // ─── 引用 ──────────────────────────────────
          blockquote({ children }) {
            return (
              <blockquote className="not-prose my-6 flex gap-4 rounded-r-lg border-l-4 border-primary/50 bg-muted/40 px-5 py-4">
                <div className="prose prose-zinc dark:prose-invert max-w-none text-muted-foreground">
                  {children}
                </div>
              </blockquote>
            )
          },

          // ─── AI の思考タグ（Qwen の <think> を安全に表示）────
          ...( { think: ThinkBlock } as any ),

          // ─── 画像 ──────────────────────────────────
          img({ src, alt, title }: ImageProps) {
            if (!src) return null

            if (imageErrors.has(src)) {
              return (
                <span className="not-prose my-6 flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
                  <XCircle className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">画像の読み込みに失敗しました</span>
                  {alt && <span className="text-xs text-muted-foreground/60">{alt}</span>}
                </span>
              )
            }

            const isInternal = src.startsWith("/") || src.includes("supabase.co")

            return isInternal ? (
              <Image
                src={src}
                alt={alt || ""}
                title={title || ""}
                width={1200}
                height={800}
                style={{ width: "100%", height: "auto" }}
                onError={() => handleImageError(src)}
                className="my-8 rounded-xl border border-border/40 shadow-md"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              />
            ) : (
              <img
                src={src}
                alt={alt || ""}
                title={title || ""}
                onError={() => handleImageError(src)}
                className="my-8 w-full rounded-xl border border-border/40 shadow-md"
                loading="lazy"
                style={{ height: "auto" }}
              />
            )
          },

          // ─── テーブル ──────────────────────────────
          table({ children }) {
            return (
              <div className="not-prose my-8 overflow-x-auto rounded-xl border border-border">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            )
          },
          thead({ children }) {
            return (
              <thead className="border-b border-border bg-muted/60">
                {children}
              </thead>
            )
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-border">{children}</tbody>
          },
          tr({ children }) {
            return (
              <tr className="transition-colors hover:bg-muted/30">
                {children}
              </tr>
            )
          },
          th({ children, style }) {
            return (
              <th
                className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                style={style}
              >
                {children}
              </th>
            )
          },
          td({ children, style }) {
            return (
              <td className="px-5 py-3 text-sm leading-relaxed text-foreground/90" style={style}>
                {children}
              </td>
            )
          },

          // ─── リスト ────────────────────────────────
          ul({ children, className: cls }) {
            const isTaskList = cls?.includes("contains-task-list")
            return (
              <ul className={isTaskList ? "not-prose my-4 space-y-2 pl-0 list-none" : undefined}>
                {children}
              </ul>
            )
          },
          ol({ children }) {
            return <ol>{children}</ol>
          },
          li({ children, className: cls }) {
            const isTaskItem = cls?.includes("task-list-item")
            if (isTaskItem) {
              return (
                <li className="flex items-start gap-2 text-sm leading-relaxed">
                  {children}
                </li>
              )
            }
            return <li>{children}</li>
          },

          // ─── 水平線 ────────────────────────────────
          hr() {
            return (
              <hr className="my-10 border-0 border-t border-border/60" />
            )
          },

          // ─── チェックボックス ──────────────────────
          input({ type, checked, ...props }) {
            if (type === "checkbox") {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 mt-0.5 h-4 w-4 rounded border border-border accent-primary"
                  {...props}
                />
              )
            }
            return <input type={type} {...props} />
          },

          // ─── カスタムdiv（Callout等）──────────────
          div({ node, children, ...props }: any) {
            const dataType = props["data-type"]

            if (dataType === "callout") {
              return (
                <Callout type={props["data-type-actual"] || "info"}>
                  {children}
                </Callout>
              )
            }
            if (dataType === "timeline") {
              return <Timeline>{children}</Timeline>
            }
            if (dataType === "timeline-item") {
              return <TimelineItem time={props["data-time"]}>{children}</TimelineItem>
            }
            if (dataType === "progress-bar") {
              return (
                <ProgressBar
                  value={parseInt(props["data-value"] || "0", 10)}
                  label={props["data-label"]}
                  color={props["data-color"]}
                />
              )
            }
            return <div {...props}>{children}</div>
          },

          // ─── メンション ────────────────────────────
          span({ node, children, ...props }: any) {
            if (props["data-type"] === "mention") {
              const id = props["data-id"]
              const label = props["data-label"] || children
              return (
                <Link
                  href={`/profile/${id}`}
                  className="mx-0.5 rounded bg-primary/10 px-1.5 py-0.5 font-bold text-primary hover:underline"
                >
                  {String(label).startsWith("@") ? label : `@${label}`}
                </Link>
              )
            }
            return <span {...props}>{children}</span>
          },

          // ─── アコーディオン（details/summary）──────
          details({ children, ...props }: any) {
            const summaryEl = React.Children.toArray(children).find(
              (c: any) => c?.type === "summary"
            ) as any
            const restChildren = React.Children.toArray(children).filter(
              (c: any) => c?.type !== "summary"
            )
            return (
              <Accordion title={summaryEl?.props?.children || "詳細を表示"}>
                {restChildren}
              </Accordion>
            )
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer