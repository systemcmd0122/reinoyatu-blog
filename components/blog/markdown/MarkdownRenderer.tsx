import React, { useState, useEffect } from "react"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import YouTubeEmbed from "./YouTubeEmbed"
import { Clipboard, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface MarkdownRendererProps {
  content: string;
  enableYouTubeDetails?: boolean;
}

interface CodeProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface ImageProps {
  src?: string;
  alt?: string;
  title?: string;
}

interface YouTubeMatch {
  index: number;
  videoId: string;
  options: {
    showDetails: boolean;
  };
}

// コードブロック用の独立したコンポーネント
const CodeBlock: React.FC<CodeProps & { codeContent: string; language?: string }> = ({ 
  inline, 
  className, 
  children, 
  codeContent, 
  language,
  ...props 
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setIsCopied(true);
  };

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  if (inline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative">
      <SyntaxHighlighter
        style={oneDark}
        language={language || 'text'}
        PreTag="div"
        {...props}
      >
        {codeContent}
      </SyntaxHighlighter>
      <button
        onClick={handleCopy}
        className={cn(
          "absolute top-2 right-2 p-1 rounded-md text-white",
          isCopied ? "bg-green-500" : "bg-gray-700 hover:bg-gray-600"
        )}
        title={isCopied ? "Copied!" : "Copy code"}
      >
        {isCopied ? <Check size={16} /> : <Clipboard size={16} />}
      </button>
    </div>
  );
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content,
  enableYouTubeDetails = true
}) => {
  // YouTubeの動画IDとオプションを抽出して保存する
  const extractYouTubeEmbeds = (markdownContent: string): {
    content: string;
    matches: YouTubeMatch[];
  } => {
    const matches: YouTubeMatch[] = [];
    
    // 基本的な形式: {{youtube:VIDEO_ID}}
    // オプション付き形式: {{youtube:VIDEO_ID:showDetails=false}}
    const processedContent = markdownContent.replace(
      /{{youtube:([^:}]+)(?::([^}]+))?}}/g,
      (match, videoId, optionsStr) => {
        // videoIdから余分な空白を削除
        const trimmedVideoId = videoId.trim();
        
        // オプションの解析
        const options = {
          showDetails: enableYouTubeDetails
        };
        
        if (optionsStr) {
          const optionParts = optionsStr.split(',');
          optionParts.forEach((part: string) => {
            const [key, value] = part.trim().split('=');
            if (key === 'showDetails') {
              options.showDetails = value.toLowerCase() === 'true';
            }
          });
        }
        
        // インデックスを保存
        const index = matches.length;
        matches.push({ 
          index, 
          videoId: trimmedVideoId, 
          options
        });
        
        // プレースホルダーを返す
        return `--youtube-embed-${index}--`;
      }
    );
    
    return { content: processedContent, matches };
  };
  
  // null, undefined, 空文字列チェック
  const safeContent = content || '';
  const { content: processedContent, matches: youtubeMatches } = extractYouTubeEmbeds(safeContent);

  // カスタムレンダリング関数
  const renderYouTubeComponent = (placeholderText: string) => {
    const match = placeholderText.match(/--youtube-embed-(\d+)--/);
    if (!match) return placeholderText;
    
    const index = parseInt(match[1], 10);
    const youtubeData = youtubeMatches[index];
    
    if (!youtubeData) return placeholderText;
    
    return (
      <YouTubeEmbed 
        key={`youtube-${index}`} 
        videoId={youtubeData.videoId}
        showDetails={youtubeData.options.showDetails}
      />
    );
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }: CodeProps) {
            const match = /language-(\w+)/.exec(className || '');
            const codeContent = String(children).replace(/\n$/, '');

            return (
              <CodeBlock
                inline={inline}
                className={className}
                codeContent={codeContent}
                language={match ? match[1] : undefined}
                {...props}
              >
                {children}
              </CodeBlock>
            );
          },
          // 画像コンポーネントをカスタマイズ
          img({ src, alt, title, ...props }: ImageProps) {
            if (!src) return null

            return (
              <div className="my-4">
                <Image
                  src={src}
                  alt={alt || ""}
                  title={title || ""}
                  width={1200}
                  height={675}
                  layout="responsive"
                  className="rounded-lg shadow-sm"
                  {...props}
                />
                {alt && <p className="text-sm text-gray-500 text-center mt-2">{alt}</p>}
              </div>
            );
          },
          h1: ({ children, ...props }) => <h1 className="text-3xl font-bold my-4" {...props}>{children}</h1>,
          h2: ({ children, ...props }) => <h2 className="text-2xl font-semibold my-3" {...props}>{children}</h2>,
          h3: ({ children, ...props }) => <h3 className="text-xl font-semibold my-2" {...props}>{children}</h3>,
          p: ({ children, ...props }) => {
            // YouTube埋め込みプレースホルダーを処理
            if (typeof children === 'string' && children.includes('--youtube-embed-')) {
              return renderYouTubeComponent(children);
            }
            
            // 複数の段落やテキストノードが混在する場合の処理
            if (Array.isArray(children)) {
              const hasYouTubeEmbed = children.some(
                child => typeof child === 'string' && child.includes('--youtube-embed-')
              );
              
              if (hasYouTubeEmbed) {
                return (
                  <div className="mb-4">
                    {children.map((child, i) => {
                      if (typeof child === 'string' && child.includes('--youtube-embed-')) {
                        return renderYouTubeComponent(child);
                      }
                      return <span key={i}>{child}</span>;
                    })}
                  </div>
                );
              }
            }
            
            return <p className="mb-4 leading-relaxed" {...props}>{children}</p>;
          },
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
          ),
          hr: () => <hr className="my-6 border-t border-gray-300" />,
          table: ({ children }) => (
            <div className="w-full overflow-x-auto my-4">
              <table className="w-full text-left border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="[&_tr]:border-b">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="[&_tr:last-child]:border-0">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([data-state=checked])]:pr-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="p-4 align-middle [&:has([data-state=checked])]:pr-0">
              {children}
            </td>
          )
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;