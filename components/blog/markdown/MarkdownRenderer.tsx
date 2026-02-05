import React, { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneLight, oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Clipboard, Check, ExternalLink, XCircle } from "lucide-react"
import Image from "next/image"
import { useTheme } from "next-themes"

import YouTubeEmbed from "./YouTubeEmbed"
import Callout from "./Callout"
import Accordion from "./Accordion"
import { Timeline, TimelineItem } from "./Timeline"
import ProgressBar from "./ProgressBar"

import "katex/dist/katex.min.css"

interface MarkdownRendererProps {
  content: string
  className?: string
  enableMath?: boolean
  enableRaw?: boolean
}

interface CodeProps {
  className?: string
  children?: React.ReactNode
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

// コードブロックコンポーネント
const CodeBlock: React.FC<{
  language?: string
  code: string
}> = ({ language, code }) => {
  const [isCopied, setIsCopied] = useState(false)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('コピーに失敗しました', err)
    }
  }

  return (
    <div className="relative group my-4 rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
        {language && (
          <span className="text-xs font-medium text-muted-foreground uppercase">
            {language}
          </span>
        )}
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 px-2 py-1 text-xs rounded hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {isCopied ? <Check size={14} /> : <Clipboard size={14} />}
          <span>{isCopied ? "コピー済み" : "コピー"}</span>
        </button>
      </div>
      <SyntaxHighlighter
        style={mounted && resolvedTheme === 'dark' ? oneDark : oneLight}
        language={language || 'text'}
        PreTag="div"
        showLineNumbers
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: '14px',
          lineHeight: '1.6',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content,
  className = "",
  enableRaw = true // デフォルトで有効にする（リッチエディタの出力をサポートするため）
}) => {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  // YouTube埋め込みの抽出
  const extractYouTubeEmbeds = (markdownContent: string): {
    content: string
    matches: YouTubeMatch[]
  } => {
    const matches: YouTubeMatch[] = []
    
    const processedContent = markdownContent.replace(
      /\{\{youtube:([^:}]+)(?::showDetails=(true|false))?\}\}/g,
      (match, videoId, showDetailsStr) => {
        const trimmedVideoId = videoId.trim()
        const showDetails = showDetailsStr !== 'false'
        
        const index = matches.length
        matches.push({ 
          index, 
          videoId: trimmedVideoId, 
          showDetails
        })
        
        return `--youtube-embed-${index}--`
      }
    )
    
    return { content: processedContent, matches }
  }

  const { content: processedContent, matches: youtubeMatches } = extractYouTubeEmbeds(content || '')

  const renderYouTubeComponent = (placeholderText: string) => {
    const match = placeholderText.match(/--youtube-embed-(\d+)--/)
    if (!match) return placeholderText
    
    const index = parseInt(match[1], 10)
    const youtubeData = youtubeMatches[index]
    
    if (!youtubeData) return placeholderText
    
    return (
      <YouTubeEmbed 
        key={`youtube-${index}`} 
        videoId={youtubeData.videoId}
        showDetails={youtubeData.showDetails}
      />
    )
  }

  const handleImageError = (src: string) => {
    setImageErrors(prev => new Set(prev).add(src))
  }

  return (
    <div className={`markdown-content prose prose-zinc dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
        rehypePlugins={[rehypeKatex, [rehypeRaw, { tagfilter: true }]]}
        components={{
          code({ className, children, ...props }: CodeProps) {
            const match = /language-(\w+)/.exec(className || '')
            const codeContent = String(children).replace(/\n$/, '')
            
            if (match) {
              return (
                <CodeBlock
                  language={match[1]}
                  code={codeContent}
                />
              )
            }
            
            return (
              <code className="bg-muted px-1.5 py-0.5 rounded-md font-mono text-[0.9em] border border-border/50" {...props}>
                {children}
              </code>
            )
          },

          img({ src, alt, title }: ImageProps) {
            if (!src || typeof src !== 'string') return null

            if (imageErrors.has(src)) {
              return (
                <div className="my-4 p-4 border-2 border-dashed border-border rounded-lg text-center bg-muted/30">
                  <XCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">画像の読み込みに失敗しました</p>
                  {alt && <p className="text-xs text-muted-foreground/80 mt-1">{alt}</p>}
                </div>
              )
            }

            return (
              <Image
                src={src}
                alt={alt || ""}
                title={title || ""}
                width={800}
                height={600}
                onError={() => handleImageError(src)}
                className="rounded-lg"
              />
            )
          },

          h1: ({ children }) => {
            const id = typeof children === 'string' ? children.replace(/\s+/g, '-').toLowerCase() : ''
            return (
              <h1 id={id} className="text-3xl font-bold my-6 pb-2 border-b-2 scroll-mt-20">
                {children}
              </h1>
            )
          },

          h2: ({ children }) => {
            const id = typeof children === 'string' ? children.replace(/\s+/g, '-').toLowerCase() : ''
            return (
              <h2 id={id} className="text-2xl font-semibold my-5 pb-2 border-b scroll-mt-20">
                {children}
              </h2>
            )
          },

          h3: ({ children }) => {
            const id = typeof children === 'string' ? children.replace(/\s+/g, '-').toLowerCase() : ''
            return (
              <h3 id={id} className="text-xl font-semibold my-4 scroll-mt-20">
                {children}
              </h3>
            )
          },

          p: ({ children }) => {
            const processChildren = (nodes: React.ReactNode): React.ReactNode => {
              if (typeof nodes === 'string') {
                const parts = nodes.split(/(--youtube-embed-\d+--)/)
                return parts.map((part) => {
                  if (part.match(/--youtube-embed-\d+--/)) {
                    return renderYouTubeComponent(part)
                  }
                  return part
                })
              }
              return nodes
            }

            const processedChildren = Array.isArray(children) 
              ? children.map(processChildren)
              : processChildren(children)

            return <p className="my-4 leading-relaxed">{processedChildren}</p>
          },

          a: ({ href, children }) => (
            <a 
              href={href}
              className="text-primary hover:underline inline-flex items-center gap-1 font-medium" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {children}
              <ExternalLink className="h-3 w-3" />
            </a>
          ),

          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-6 py-2 my-8 bg-muted/30 italic text-muted-foreground rounded-r-lg">
              {children}
            </blockquote>
          ),

          hr: () => <hr className="my-8 border-t-2" />,

          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full border-collapse">
                {children}
              </table>
            </div>
          ),

          li: ({ children, ...props }) => {
            const isTaskList = props.className?.includes('task-list-item')
            
            if (isTaskList) {
              return (
                <li className="list-none flex items-start gap-2" {...props}>
                  {children}
                </li>
              )
            }
            
            return <li className="my-1" {...props}>{children}</li>
          },

          // カスタム要素のハンドリング
          div: ({ node, children, ...props }: any) => {
            const dataType = props['data-type']
            const type = props['data-type'] || props.type;

            if (dataType === 'callout') {
              return <Callout type={props['data-type-actual'] || 'info'}>{children}</Callout>
            }

            if (dataType === 'timeline') {
              return <Timeline>{children}</Timeline>
            }

            if (dataType === 'timeline-item') {
              return <TimelineItem time={props['data-time']}>{children}</TimelineItem>
            }

            if (dataType === 'progress-bar') {
              return (
                <ProgressBar
                  value={parseInt(props['data-value'] || '0', 10)}
                  label={props['data-label']}
                  color={props['data-color']}
                />
              )
            }

            return <div {...props}>{children}</div>
          },

          details: ({ children, ...props }: any) => {
            const summary = React.Children.toArray(children).find(
              (child: any) => child.type === 'summary'
            ) as any
            const content = React.Children.toArray(children).filter(
              (child: any) => child.type !== 'summary'
            )

            return (
              <Accordion title={summary?.props?.children || '詳細を表示'}>
                {content}
              </Accordion>
            )
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
