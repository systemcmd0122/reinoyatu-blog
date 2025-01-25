import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism"

interface MarkdownRendererProps {
  content: string
}

interface CodeProps {
  inline?: boolean
  className?: string
  children?: React.ReactNode
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ inline, className, children, ...props }: CodeProps) {
          const match = /language-(\w+)/.exec(className || '')
          return !inline && match ? (
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          )
        },
        h1: ({ children, ...props }) => <h1 className="text-3xl font-bold my-4" {...props}>{children}</h1>,
        h2: ({ children, ...props }) => <h2 className="text-2xl font-semibold my-3" {...props}>{children}</h2>,
        h3: ({ children, ...props }) => <h3 className="text-xl font-semibold my-2" {...props}>{children}</h3>,
        p: ({ children, ...props }) => <p className="mb-4 leading-relaxed" {...props}>{children}</p>,
        a: ({ href, children, ...props }) => (
          <a 
            href={href}
            className="text-blue-600 hover:underline" 
            target="_blank" 
            rel="noopener noreferrer" 
            {...props}
          >
            {children}
          </a>
        ),
        ul: ({ children, ...props }) => <ul className="list-disc list-inside mb-4" {...props}>{children}</ul>,
        ol: ({ children, ...props }) => <ol className="list-decimal list-inside mb-4" {...props}>{children}</ol>,
        blockquote: ({ children, ...props }) => (
          <blockquote 
            className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-600" 
            {...props}
          >
            {children}
          </blockquote>
        )
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

export default MarkdownRenderer