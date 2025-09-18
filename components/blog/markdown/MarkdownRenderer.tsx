import React, { useState, useEffect, isValidElement } from "react"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import remarkEmoji from "remark-emoji"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import YouTubeEmbed from "./YouTubeEmbed"
import { 
  Clipboard, 
  Check, 
  ExternalLink, 
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle} from "lucide-react"
import { cn } from "@/lib/utils"

interface MarkdownRendererProps {
  content: string;
  enableYouTubeDetails?: boolean;
  enableLineNumbers?: boolean;
  enableCopyButton?: boolean;
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

type AlertType = 'info' | 'warning' | 'error' | 'success';

// コードブロック用の独立したコンポーネント
const CodeBlock: React.FC<CodeProps & { 
  codeContent: string; 
  language?: string; 
  enableLineNumbers?: boolean;
  enableCopyButton?: boolean;
}> = ({ 
  inline, 
  className, 
  children, 
  codeContent, 
  language,
  enableLineNumbers = true,
  enableCopyButton = true,
  ...props 
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setIsCopied(true);
    } catch (err) {
      // フォールバック
      const textArea = document.createElement('textarea');
      textArea.value = codeContent;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setIsCopied(true);
      } catch (fallbackErr) {
        console.error('コピーに失敗しました', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  // インラインコードの処理（Discordスタイル）
  if (inline) {
    return (
      <code 
        className={cn(
          "inline-flex items-center px-1.5 py-0.5 rounded text-sm font-mono",
          "bg-gray-800 text-gray-100",
          "break-words",
          className
        )}
        style={{
          backgroundColor: '#2f3136',
          color: '#dcddde',
          fontFamily: 'Consolas, "Andale Mono WT", "Andale Mono", "Lucida Console", "Lucida Sans Typewriter", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Liberation Mono", "Nimbus Mono L", Monaco, "Courier New", Courier, monospace',
          fontSize: '0.875rem',
          borderRadius: '3px',
          padding: '0.125rem 0.25rem'
        }}
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-6 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          {language && (
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide px-2 py-1 bg-gray-200 rounded">
              {language}
            </span>
          )}
        </div>
        
        {enableCopyButton && (
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200",
              "opacity-0 group-hover:opacity-100",
              isCopied 
                ? "bg-green-100 text-green-700 border border-green-200" 
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
            )}
            title={isCopied ? "コピーしました!" : "コードをコピー"}
          >
            {isCopied ? <Check size={14} /> : <Clipboard size={14} />}
            <span>{isCopied ? "コピー済み" : "コピー"}</span>
          </button>
        )}
      </div>
      
      {/* コードブロック */}
      <div className="relative">
        <SyntaxHighlighter
          style={oneLight}
          language={language || 'text'}
          PreTag="div"
          showLineNumbers={enableLineNumbers}
          wrapLines={true}
          wrapLongLines={true}
          customStyle={{
            margin: 0,
            padding: '16px',
            fontSize: '14px',
            lineHeight: '1.6',
            background: '#fafafa',
            borderRadius: 0,
          }}
          codeTagProps={{
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            }
          }}
          lineNumberStyle={{
            color: '#9ca3af',
            fontSize: '12px',
            paddingRight: '16px',
            minWidth: '40px',
          }}
          {...props}
        >
          {codeContent}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

// スポイラーコンテンツ用のコンポーネント
const Spoiler: React.FC<{ content: string }> = ({ content }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <span 
      className={cn(
        "inline-block px-1 py-0.5 rounded cursor-pointer transition-all duration-300 select-none",
        isRevealed 
          ? "bg-transparent text-inherit" 
          : "bg-gray-900 text-gray-900 hover:bg-gray-800"
      )}
      onClick={() => setIsRevealed(!isRevealed)}
      title={isRevealed ? "クリックして隠す" : "クリックして表示"}
    >
      {isRevealed ? content : "■ ".repeat(Math.min(content.length, 10))}
    </span>
  );
};

// 警告・情報ボックスコンポーネント
const AlertBox: React.FC<{ 
  type: AlertType; 
  content: string; 
  title?: string;
}> = ({ type, content, title }) => {
  const styles = {
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: Info,
      iconColor: "text-blue-600",
      titleColor: "text-blue-800",
      textColor: "text-blue-700"
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      icon: AlertTriangle,
      iconColor: "text-yellow-600",
      titleColor: "text-yellow-800",
      textColor: "text-yellow-700"
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: XCircle,
      iconColor: "text-red-600",
      titleColor: "text-red-800",
      textColor: "text-red-700"
    },
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: CheckCircle,
      iconColor: "text-green-600",
      titleColor: "text-green-800",
      textColor: "text-green-700"
    }
  };

  const style = styles[type];
  const IconComponent = style.icon;

  return (
    <div className={cn("my-4 p-4 rounded-lg border", style.bg, style.border)}>
      <div className="flex items-start space-x-3">
        <IconComponent className={cn("h-5 w-5 mt-0.5 flex-shrink-0", style.iconColor)} />
        <div className="flex-1">
          {title && (
            <h4 className={cn("font-semibold mb-1", style.titleColor)}>
              {title}
            </h4>
          )}
          <div className={cn("text-sm", style.textColor)}>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
};

// メインのMarkdownRendererコンポーネント
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content,
  enableYouTubeDetails = true,
  enableLineNumbers = true,
  enableCopyButton = true
}) => {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // YouTubeの動画IDとオプションを抽出して保存する
  const extractYouTubeEmbeds = (markdownContent: string): {
    content: string;
    matches: YouTubeMatch[];
  } => {
    const matches: YouTubeMatch[] = [];
    
    const processedContent = markdownContent.replace(
      /{{youtube:([^:}]+)(?::([^}]+))?}}/g,
      (match, videoId, optionsStr) => {
        const trimmedVideoId = videoId.trim();
        
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
        
        const index = matches.length;
        matches.push({ 
          index, 
          videoId: trimmedVideoId, 
          options
        });
        
        return `--youtube-embed-${index}--`;
      }
    );
    
    return { content: processedContent, matches };
  };
  
  // スポイラーコンテンツを抽出して処理する
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

  // 警告・情報ボックスを抽出して処理する
  const extractAlertBoxes = (markdownContent: string): {
    content: string;
    alertMatches: { [key: string]: { type: string; content: string; title?: string } };
  } => {
    const alertMatches: { [key: string]: { type: string; content: string; title?: string } } = {};
    let alertIndex = 0;

    // ::: 形式の処理
    const processed = markdownContent.replace(
      /:::(\w+)(?:\s+(.+?))?\n([\s\S]*?):::/g,
      (match, type, title, content) => {
        const placeholder = `--alert-${alertIndex}--`;
        alertMatches[placeholder] = {
          type: type.toLowerCase(),
          content: content.trim(),
          title: title?.trim()
        };
        alertIndex++;
        return placeholder;
      }
    );

    return { content: processed, alertMatches };
  };

  // null, undefined, 空文字列チェック
  const safeContent = content || '';
  const { content: processedContent, matches: youtubeMatches } = extractYouTubeEmbeds(safeContent);
  const { content: spoilerContent, spoilerMatches } = extractSpoilers(processedContent);
  const { content: finalContent, alertMatches } = extractAlertBoxes(spoilerContent);

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

  const handleImageError = (src: string) => {
    setImageErrors(prev => new Set(prev).add(src));
  };

  return (
    <div className="markdown-content prose prose-zinc max-w-none">
      <style jsx global>{`
        .markdown-content {
          line-height: 1.7;
        }
        .markdown-content p {
          margin-bottom: 1rem;
          margin-top: 1rem;
        }
        .markdown-content ul {
          margin-bottom: 1.5rem;
          margin-top: 1.5rem;
        }
        .markdown-content li {
          margin-bottom: 0.5rem;
        }
        .markdown-content li > p {
          margin-bottom: 0.25rem;
          margin-top: 0.25rem;
        }
        .markdown-content pre {
          margin-bottom: 1.5rem;
          margin-top: 1.5rem;
        }
        .markdown-content blockquote {
          margin-bottom: 1.5rem;
          margin-top: 1.5rem;
        }
      `}</style>
      
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks, remarkEmoji]}
        components={{
          // コードブロックのみ（インラインコードは通常のテキストとして扱う）
          code({ inline, className, children, ...props }: CodeProps) {
            // インラインコードは処理しない
            if (inline) {
              return <>{children}</>;
            }

            const match = /language-(\w+)/.exec(className || '');
            const codeContent = String(children).replace(/\n$/, '');

            return (
              <CodeBlock
                inline={inline}
                className={className}
                codeContent={codeContent}
                language={match ? match[1] : undefined}
                enableLineNumbers={enableLineNumbers}
                enableCopyButton={enableCopyButton}
                {...props}
              >
                {children}
              </CodeBlock>
            );
          },

          // 画像コンポーネント
          img({ src, alt, title, ...props }: ImageProps) {
            if (!src) return null;

            if (imageErrors.has(src)) {
              return (
                <div className="my-6 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
                  <div className="text-gray-500">
                    <XCircle className="h-12 w-12 mx-auto mb-3" />
                    <p className="text-sm font-medium">画像の読み込みに失敗しました</p>
                    {alt && <p className="text-xs text-gray-400 mt-1">{alt}</p>}
                  </div>
                </div>
              );
            }

            return (
              <div className="my-8 group">
                <div className="relative overflow-hidden rounded-lg shadow-md border border-gray-200 bg-white">
                  <Image
                    src={src}
                    alt={alt || ""}
                    title={title || ""}
                    width={1200}
                    height={675}
                    layout="responsive"
                    className="transition-transform duration-300 group-hover:scale-105"
                    onError={() => handleImageError(src)}
                    {...props}
                  />
                </div>
                {(alt || title) && (
                  <div className="mt-3 text-center">
                    <p className="text-sm text-gray-600 italic font-medium">
                      {alt || title}
                    </p>
                  </div>
                )}
              </div>
            );
          },

          // 見出し
          h1: ({ children, ...props }) => (
            <h1 className="text-3xl font-bold my-8 pb-3 border-b-2 border-gray-200 text-gray-900" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-2xl font-semibold my-6 pb-2 border-b border-gray-200 text-gray-900" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-xl font-semibold my-5 text-gray-900" {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="text-lg font-semibold my-4 text-gray-900" {...props}>
              {children}
            </h4>
          ),
          h5: ({ children, ...props }) => (
            <h5 className="text-base font-semibold my-3 text-gray-900" {...props}>
              {children}
            </h5>
          ),
          h6: ({ children, ...props }) => (
            <h6 className="text-sm font-semibold my-2 text-gray-900" {...props}>
              {children}
            </h6>
          ),

          // 段落
          p: ({ children, ...props }) => {
            const processChildren = (nodes: React.ReactNode[]): React.ReactNode[] => {
              return nodes.flatMap((node, i) => {
                if (typeof node === 'string') {
                  const parts = node.split(/(--youtube-embed-\d+--|--spoiler-\d+--|--alert-\d+--)/);
                  return parts.map((part, j) => {
                    if (part.match(/--youtube-embed-\d+--/)) {
                      return renderYouTubeComponent(part);
                    }
                    if (part.match(/--spoiler-\d+--/)) {
                      const spoilerContent = spoilerMatches[part.trim()];
                      return spoilerContent ? <Spoiler key={`${i}-${j}`} content={spoilerContent} /> : part;
                    }
                    if (part.match(/--alert-\d+--/)) {
                      const alertData = alertMatches[part.trim()];
                      return alertData ? (
                        <AlertBox 
                          key={`${i}-${j}`} 
                          type={alertData.type as AlertType}
                          content={alertData.content}
                          title={alertData.title}
                        />
                      ) : part;
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

            // 特別なコンポーネントのみの場合はdivでラップ
            const isOnlySpecialComponent = contentNodes.length > 0 && contentNodes.every(
              (child) => isValidElement(child) && (
                child.type === YouTubeEmbed || 
                child.type === Spoiler || 
                child.type === AlertBox
              )
            );

            if (isOnlySpecialComponent) {
              return <div className="my-4">{contentNodes}</div>;
            }

            return (
              <p className="my-4 leading-relaxed text-gray-800 text-base" {...props}>
                {processedChildren}
              </p>
            );
          },

          // リンク
          a: ({ href, children, ...props }) => (
            <a 
              href={href}
              className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 transition-colors duration-200 font-medium" 
              target="_blank" 
              rel="noopener noreferrer" 
              {...props}
            >
              {children}
              <ExternalLink className="h-3 w-3" />
            </a>
          ),

          // リスト
          ul: ({ children, ...props }) => (
            <ul className="my-6 space-y-2 text-gray-800" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="my-6 space-y-2 text-gray-800" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-relaxed flex items-start" {...props}>
              <span className="flex-1 pl-2">
                {children}
              </span>
            </li>
          ),

          // 引用
          blockquote: ({ children, ...props }) => (
            <blockquote 
              className="border-l-4 border-blue-500 pl-6 py-4 my-6 bg-blue-50 italic text-gray-700 rounded-r-lg shadow-sm" 
              {...props}
            >
              {children}
            </blockquote>
          ),

          // 水平線
          hr: () => <hr className="my-8 border-t-2 border-gray-200" />,

          // テーブル
          table: ({ children }) => (
            <div className="w-full overflow-x-auto my-8 rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full text-left border-collapse bg-white">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-200">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="transition-colors hover:bg-gray-50">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-6 py-4 text-sm text-gray-900">
              {children}
            </td>
          ),

          // 強調
          strong: ({ children, ...props }) => (
            <strong className="font-bold text-gray-900" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className="italic text-gray-800" {...props}>
              {children}
            </em>
          ),

          // 取り消し線
          del: ({ children, ...props }) => (
            <del className="line-through text-gray-600" {...props}>
              {children}
            </del>
          ),
        }}
      >
        {finalContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;