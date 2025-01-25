import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism"

interface MarkdownRendererProps {
  content: string
}

interface CodeProps {
  node?: any
  inline?: boolean
  className?: string
  children?: React.ReactNode
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }: CodeProps) {
          const match = /language-(\w+)/.exec(className || '')
          return !inline && match ? (
            <SyntaxHighlighter
              style={oneDark as any}
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
        h1: ({node, ...props}) => <h1 className="text-3xl font-bold my-4" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-2xl font-semibold my-3" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-xl font-semibold my-2" {...props} />,
        p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
        a: ({node, ...props}) => (
          <a 
            className="text-blue-600 hover:underline" 
            target="_blank" 
            rel="noopener noreferrer" 
            {...props} 
          />
        ),
        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4" {...props} />,
        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4" {...props} />,
        blockquote: ({node, ...props}) => (
          <blockquote 
            className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-600" 
            {...props} 
          />
        )
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

export default MarkdownRenderer