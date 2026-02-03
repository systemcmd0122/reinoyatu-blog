import React, { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneLight, oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Clipboard, Check, ExternalLink, XCircle } from "lucide-react"
import Image from "next/image"

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

// YouTubeコンポーネント
const YouTubeEmbed: React.FC<{
  videoId: string
  showDetails?: boolean
}> = ({ videoId, showDetails = true }) => {
  const [videoInfo, setVideoInfo] = useState<{
    title: string
    description: string
  } | null>(null)

  useEffect(() => {
    if (showDetails) {
      // 簡易的なタイトル表示（APIキーなしでも動作）
      setVideoInfo({
        title: "YouTube Video",
        description: "動画の詳細情報"
      })
    }
  }, [videoId, showDetails])

  return (
    <div className="my-6 bg-gray-50 rounded-lg overflow-hidden border">
      <div className="relative w-full pt-[56.25%]">
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={videoInfo?.title || "YouTube video"}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {showDetails && videoInfo && (
        <div className="p-4">
          <h3 className="text-lg font-semibold">{videoInfo.title}</h3>
          <p className="text-sm text-gray-600 mt-2">{videoInfo.description}</p>
        </div>
      )}
    </div>
  )
}

// コードブロックコンポーネント
const CodeBlock: React.FC<{
  language?: string
  code: string
}> = ({ language, code }) => {
  const [isCopied, setIsCopied] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // ダークモード検出
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
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
    <div className="relative group my-4 rounded-lg border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
        {language && (
          <span className="text-xs font-medium text-gray-600 uppercase">
            {language}
          </span>
        )}
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 px-2 py-1 text-xs rounded hover:bg-gray-200 transition-colors"
        >
          {isCopied ? <Check size={14} /> : <Clipboard size={14} />}
          <span>{isCopied ? "コピー済み" : "コピー"}</span>
        </button>
      </div>
      <SyntaxHighlighter
        style={isDark ? oneDark : oneLight}
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
  enableRaw = false
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
      <style jsx global>{`
        .markdown-content {
          line-height: 1.8;
          font-size: 1rem;
        }

        .markdown-content p {
          margin: 1rem 0;
        }

        .markdown-content h1, 
        .markdown-content h2, 
        .markdown-content h3,
        .markdown-content h4, 
        .markdown-content h5, 
        .markdown-content h6 {
          margin: 1.5rem 0 1rem;
          font-weight: 600;
          line-height: 1.3;
        }

        .markdown-content h1 { font-size: 2rem; }
        .markdown-content h2 { font-size: 1.5rem; }
        .markdown-content h3 { font-size: 1.25rem; }

        .markdown-content ul, 
        .markdown-content ol {
          margin: 1rem 0;
          padding-left: 1.5rem;
        }

        .markdown-content li {
          margin: 0.25rem 0;
        }

        .markdown-content code {
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          background-color: #f3f4f6;
          font-size: 0.875rem;
          font-family: monospace;
        }

        .markdown-content blockquote {
          margin: 1rem 0;
          padding: 0.5rem 1rem;
          border-left: 4px solid #3b82f6;
          background-color: #f9fafb;
        }

        .markdown-content table {
          width: 100%;
          margin: 1rem 0;
          border-collapse: collapse;
        }

        .markdown-content table th,
        .markdown-content table td {
          padding: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .markdown-content table th {
          background-color: #f3f4f6;
          font-weight: 600;
        }

        .markdown-content hr {
          margin: 2rem 0;
          border: 0;
          border-top: 1px solid #e5e7eb;
        }

        .markdown-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
      `}</style>
      
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        skipHtml={!enableRaw}
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
              <code className={className} {...props}>
                {children}
              </code>
            )
          },

          img({ src, alt, title }: ImageProps) {
            if (!src || typeof src !== 'string') return null

            if (imageErrors.has(src)) {
              return (
                <div className="my-4 p-4 border-2 border-dashed rounded-lg text-center bg-gray-50">
                  <XCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">画像の読み込みに失敗しました</p>
                  {alt && <p className="text-xs text-gray-400 mt-1">{alt}</p>}
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

          h1: ({ children }) => (
            <h1 className="text-3xl font-bold my-6 pb-2 border-b-2">
              {children}
            </h1>
          ),

          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold my-5 pb-2 border-b">
              {children}
            </h2>
          ),

          h3: ({ children }) => (
            <h3 className="text-xl font-semibold my-4">
              {children}
            </h3>
          ),

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
              className="text-blue-600 hover:underline inline-flex items-center gap-1" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {children}
              <ExternalLink className="h-3 w-3" />
            </a>
          ),

          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 italic">
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
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer