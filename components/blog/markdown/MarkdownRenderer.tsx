import React, { useState, useEffect, isValidElement } from "react"
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
        <code 
          className={cn(
            "bg-gray-200 dark:bg-gray-700 text-red-500 dark:text-red-400 px-1.5 py-0.5 rounded-md text-sm font-mono",
            className
          )}
          {...props}
        >
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

  // ネタバレコンテンツ用のコンポーネント
  const Spoiler: React.FC<{ content: string }> = ({ content }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <span 
        className={cn(
          "transition-colors duration-300 ease-in-out",
          isOpen ? "bg-transparent text-inherit" : "bg-gray-800 text-gray-800 dark:bg-gray-300 dark:text-gray-300",
          "cursor-pointer rounded-md px-1"
        )}
        onClick={() => setIsOpen(!isOpen)}
        title="Click to reveal spoiler"
      >
        {content}
      </span>
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

  // ネタバレコンテンツを抽出して処理する
  const extractSpoilers = (markdownContent: string): {
    content: string;
    spoilerMatches: { [key: string]: string };
  } => {
    const spoilerMatches: { [key: string]: string } = {};
    let spoilerIndex = 0;

    // ||spoiler|| 形式の処理
    let processed = markdownContent.replace(/\|\|(.+?)\|\|/g, (match, content) => {
      const placeholder = `--spoiler-${spoilerIndex}--`;
      spoilerMatches[placeholder] = content;
      spoilerIndex++;
      return placeholder;
    });

    // /spoiler 形式の処理 (行頭)
    processed = processed.replace(/^\/spoiler\s+(.+)/gm, (match, content) => {
      const placeholder = `--spoiler-${spoilerIndex}--`;
      spoilerMatches[placeholder] = content;
      spoilerIndex++;
      return placeholder;
    });

    return { content: processed, spoilerMatches };
  };

  const { content: finalContent, spoilerMatches } = extractSpoilers(processedContent);


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
            const processChildren = (nodes: React.ReactNode[]): React.ReactNode[] => {
              return nodes.flatMap((node, i) => {
                if (typeof node === 'string') {
                  const parts = node.split(/(--youtube-embed-\d+--|--spoiler-\d+--)/);
                  return parts.map((part, j) => {
                    if (part.match(/--youtube-embed-\d+--/)) {
                      return renderYouTubeComponent(part);
                    }
                    if (part.match(/--spoiler-\d+--/)) {
                      const spoilerContent = spoilerMatches[part.trim()];
                      return spoilerContent ? <Spoiler key={`${i}-${j}`} content={spoilerContent} /> : part;
                    }
                    return part;
                  });
                }
                return node;
              });
            };

            const processedChildren = Array.isArray(children) ? processChildren(children) : processChildren([children]);

            const contentNodes = processedChildren.filter(node => {
              if (typeof node === 'string' && !node.trim()) {
                return false;
              }
              return true;
            });

            // YouTube埋め込みのみ、またはネタバレのみの場合はdivでラップ
            const isOnlyEmbed = contentNodes.length > 0 && contentNodes.every(
              (child) => isValidElement(child) && (child.type === YouTubeEmbed || child.type === Spoiler)
            );

            if (isOnlyEmbed) {
              return <div className="mb-4">{contentNodes}</div>;
            }

            return <p className="mb-4 leading-relaxed" {...props}>{processedChildren}</p>;
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
        {finalContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;