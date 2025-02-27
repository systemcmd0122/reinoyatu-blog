import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism"
import YouTubeEmbed from "./YouTubeEmbed"

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
    // オプション付き形式: {{youtube:VIDEO_ID:options}}
    const processedContent = markdownContent.replace(
      /{{youtube:([a-zA-Z0-9_-]+)(?::([^}]+))?}}/g,
      (match, videoId, optionsStr, offset) => {
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
        
        matches.push({ 
          index: matches.length, 
          videoId,
          options
        });
        
        // プレースホルダーを返す - 特別なプレースホルダー形式
        return `youtube-embed-${matches.length - 1}`;
      }
    );
    
    return { content: processedContent, matches };
  };
  
  const { content: processedContent, matches: youtubeMatches } = extractYouTubeEmbeds(content);

  // カスタムレンダリング関数
  const renderCustomComponents = (text: string) => {
    if (!text) return null;
    
    // YouTubeプレースホルダーを分割して処理
    const parts = text.split(/(youtube-embed-\d+)/);
    
    if (parts.length <= 1) {
      // プレースホルダーがない場合は通常のテキストを返す
      return <span>{text}</span>;
    }
    
    return (
      <>
        {parts.map((part, index) => {
          const match = part.match(/youtube-embed-(\d+)/);
          if (match) {
            const youtubeIndex = parseInt(match[1], 10);
            const youtubeData = youtubeMatches[youtubeIndex];
            
            if (youtubeData) {
              return (
                <YouTubeEmbed 
                  key={`youtube-${index}`} 
                  videoId={youtubeData.videoId}
                  showDetails={youtubeData.options.showDetails}
                />
              );
            }
          }
          return <span key={`text-${index}`}>{part}</span>;
        })}
      </>
    );
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }: CodeProps) {
            const match = /language-(\w+)/.exec(className || '');
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
            );
          },
          // 画像コンポーネントをカスタマイズ
          img({ src, alt, title, ...props }: ImageProps) {
            return (
              <div className="my-4">
                <img
                  src={src}
                  alt={alt || ""}
                  title={title || ""}
                  className="max-w-full h-auto rounded-lg shadow-sm"
                  loading="lazy"
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
            // テキストコンテンツを確認
            if (typeof children === 'string' && children.includes('youtube-embed-')) {
              return renderCustomComponents(children);
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
          hr: () => <hr className="my-6 border-t border-gray-300" />
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;