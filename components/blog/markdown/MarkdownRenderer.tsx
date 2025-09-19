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
  XCircle,
  Calendar,
  Clock,
  Play,
  Pause,
  Volume2,
  VolumeX,
  FileText,
  Lightbulb,
  Star,
  Shield} from "lucide-react"
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


interface CalloutProps {
  type: string;
  title?: string;
  content: string;
  collapsible?: boolean;
}

interface AudioPlayerProps {
  src: string;
  title?: string;
}

interface CountdownProps {
  targetDate: string;
  title?: string;
}

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  color?: string;
}

interface TabsProps {
  tabs: Array<{
    title: string;
    content: string;
  }>;
}

interface TimelineProps {
  events: Array<{
    date: string;
    title: string;
    description?: string;
  }>;
}

interface AccordionProps {
  items: Array<{
    title: string;
    content: string;
  }>;
}

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
      {isRevealed ? content : "▊ ".repeat(Math.min(content.length, 10))}
    </span>
  );
};

// カラウトコンポーネント（拡張版アラートボックス）
const Callout: React.FC<CalloutProps> = ({ type, title, content, collapsible }) => {
  const [isExpanded, setIsExpanded] = useState(!collapsible);

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
    },
    note: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      icon: FileText,
      iconColor: "text-gray-600",
      titleColor: "text-gray-800",
      textColor: "text-gray-700"
    },
    tip: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: Lightbulb,
      iconColor: "text-emerald-600",
      titleColor: "text-emerald-800",
      textColor: "text-emerald-700"
    },
    important: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      icon: Star,
      iconColor: "text-purple-600",
      titleColor: "text-purple-800",
      textColor: "text-purple-700"
    },
    caution: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      icon: Shield,
      iconColor: "text-orange-600",
      titleColor: "text-orange-800",
      textColor: "text-orange-700"
    }
  };

  const style = styles[type as keyof typeof styles] || styles.info;
  const IconComponent = style.icon;

  return (
    <div className={cn("my-6 rounded-lg border", style.bg, style.border)}>
      <div 
        className={cn(
          "flex items-start space-x-3 p-4",
          collapsible && "cursor-pointer hover:bg-opacity-80"
        )}
        onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <IconComponent className={cn("h-5 w-5 mt-0.5 flex-shrink-0", style.iconColor)} />
        <div className="flex-1">
          <h4 className={cn("font-semibold flex items-center justify-between", style.titleColor)}>
            {title || type.charAt(0).toUpperCase() + type.slice(1)}
            {collapsible && (
              <span className="text-sm">{isExpanded ? '▼' : '▶'}</span>
            )}
          </h4>
          {isExpanded && (
            <div className={cn("text-sm mt-2", style.textColor)}>
              <ReactMarkdown 
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                  li: ({ children }) => <li className="mb-1">{children}</li>
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// オーディオプレイヤーコンポーネント
const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, title }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    setAudioRef(audio);

    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [src]);

  const togglePlay = () => {
    if (audioRef) {
      if (isPlaying) {
        audioRef.pause();
      } else {
        audioRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef) {
      audioRef.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef) {
      audioRef.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="my-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 shadow-sm">
      <div className="flex items-center space-x-4">
        <button
          onClick={togglePlay}
          className="flex-shrink-0 w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center transition-colors"
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
        </button>
        
        <div className="flex-1">
          {title && (
            <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
          )}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 w-12">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #9333ea 0%, #9333ea ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`
              }}
            />
            <span className="text-sm text-gray-600 w-12">{formatTime(duration)}</span>
          </div>
        </div>
        
        <button
          onClick={toggleMute}
          className="flex-shrink-0 w-8 h-8 text-gray-600 hover:text-purple-600 transition-colors"
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
};

// カウントダウンタイマーコンポーネント
const CountdownTimer: React.FC<CountdownProps> = ({ targetDate, title }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="my-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 text-center">
      {title && (
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-center">
          <Clock className="h-5 w-5 mr-2" />
          {title}
        </h3>
      )}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div key={unit} className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-3xl font-bold text-blue-600">{value}</div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// プログレスバーコンポーネント
const ProgressBar: React.FC<ProgressBarProps> = ({ value, max = 100, label, color = 'blue' }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500'
  };

  return (
    <div className="my-4">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm text-gray-600">{value} / {max}</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className={cn("h-3 rounded-full transition-all duration-500", colorClasses[color as keyof typeof colorClasses])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-right text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</div>
    </div>
  );
};

// タブコンポーネント
const Tabs: React.FC<TabsProps> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="my-6 border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex border-b border-gray-200 bg-gray-50">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === index
                ? "bg-white text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="p-4 bg-white">
        <ReactMarkdown>{tabs[activeTab]?.content}</ReactMarkdown>
      </div>
    </div>
  );
};

// タイムラインコンポーネント
const Timeline: React.FC<TimelineProps> = ({ events }) => {
  return (
    <div className="my-6">
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
        {events.map((event, index) => (
          <div key={index} className="relative flex items-start space-x-4 pb-8">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-600 mb-1">{event.date}</div>
              <h4 className="font-semibold text-gray-900 mb-2">{event.title}</h4>
              {event.description && (
                <p className="text-gray-700 text-sm">{event.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// アコーディオンコンポーネント
const Accordion: React.FC<AccordionProps> = ({ items }) => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className="my-6 space-y-2">
      {items.map((item, index) => (
        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleItem(index)}
            className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
          >
            <span className="font-medium text-gray-900">{item.title}</span>
            <span className="text-gray-500">
              {openItems.has(index) ? '▼' : '▶'}
            </span>
          </button>
          {openItems.has(index) && (
            <div className="p-4 bg-white border-t border-gray-200">
              <ReactMarkdown>{item.content}</ReactMarkdown>
            </div>
          )}
        </div>
      ))}
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

    let processed = markdownContent.replace(/\|\|(.+?)\|\|/g, (match, content) => {
      const placeholder = `--spoiler-${spoilerIndex}--`;
      spoilerMatches[placeholder] = content;
      spoilerIndex++;
      return placeholder;
    });

    processed = processed.replace(/^\/spoiler\s+(.+)/gm, (match, content) => {
      const placeholder = `--spoiler-${spoilerIndex}--`;
      spoilerMatches[placeholder] = content;
      spoilerIndex++;
      return placeholder;
    });

    return { content: processed, spoilerMatches };
  };

  // カラウトボックスを抽出して処理する
interface CalloutMatch {
  type: string;
  content: string;
  title?: string;
  collapsible: boolean;
}

  const extractCallouts = (markdownContent: string): {
    content: string;
    calloutMatches: { [key: string]: CalloutMatch };
  } => {
    const calloutMatches: { [key: string]: CalloutMatch } = {};
    let calloutIndex = 0;

    // ::: 形式の処理（折りたたみ可能オプション付き）
    const processed = markdownContent.replace(
      /:::(\w+)(?:\s+(.+?))?\s*(?:\[collapsible(?:=([^[\]]*))?\])?\n([\s\S]*?):::/g,
      (match, type, title, collapsibleTitle, content) => {
        const placeholder = `--callout-${calloutIndex}--`;
        calloutMatches[placeholder] = {
          type: type.toLowerCase(),
          content: content.trim(),
          title: title?.trim() || collapsibleTitle?.trim(),
          collapsible: match.includes('[collapsible')
        };
        calloutIndex++;
        return placeholder;
      }
    );

    return { content: processed, calloutMatches };
  };

  // 新しい機能の抽出関数
type FeatureMatch = (AudioPlayerProps & { type: 'audio' }) |
                    (CountdownProps & { type: 'countdown' }) |
                    (ProgressBarProps & { type: 'progress' }) |
                    (TabsProps & { type: 'tabs' }) |
                    (TimelineProps & { type: 'timeline' }) |
                    (AccordionProps & { type: 'accordion' });

  const extractEnhancedFeatures = (markdownContent: string): {
    content: string;
    featureMatches: { [key: string]: FeatureMatch };
  } => {
    const featureMatches: { [key: string]: FeatureMatch } = {};
    let featureIndex = 0;

    let processed = markdownContent;

    // オーディオプレイヤー: {{audio:URL:title}}
    processed = processed.replace(
      /{{audio:([^:}]+)(?::([^}]+))?}}/g,
      (match, src, title) => {
        const placeholder = `--audio-${featureIndex}--`;
        featureMatches[placeholder] = {
          type: 'audio',
          src: src.trim(),
          title: title?.trim()
        };
        featureIndex++;
        return placeholder;
      }
    );

    // カウントダウンタイマー: {{countdown:YYYY-MM-DD HH:mm:title}}
    processed = processed.replace(
      /{{countdown:([^:}]+)(?::([^}]+))?}}/g,
      (match, targetDate, title) => {
        const placeholder = `--countdown-${featureIndex}--`;
        featureMatches[placeholder] = {
          type: 'countdown',
          targetDate: targetDate.trim(),
          title: title?.trim()
        };
        featureIndex++;
        return placeholder;
      }
    );

    // プログレスバー: {{progress:value:max:label:color}}
    processed = processed.replace(
      /{{progress:(\d+)(?::(\d+))?(?::([^:}]+))?(?::([^}]+))?}}/g,
      (match, value, max, label, color) => {
        const placeholder = `--progress-${featureIndex}--`;
        featureMatches[placeholder] = {
          type: 'progress',
          value: parseInt(value),
          max: max ? parseInt(max) : 100,
          label: label?.trim(),
          color: color?.trim() || 'blue'
        };
        featureIndex++;
        return placeholder;
      }
    );

    // タブ: {{tabs:tab1:content1|tab2:content2|tab3:content3}}
    processed = processed.replace(
      /{{tabs:([^}]+)}}/g,
      (match, tabsStr) => {
        const placeholder = `--tabs-${featureIndex}--`;
        const tabs = tabsStr.split('|').map((tab: string) => {
          const [title, content] = tab.split(':', 2);
          return {
            title: title?.trim() || '',
            content: content?.trim() || ''
          };
        });
        featureMatches[placeholder] = {
          type: 'tabs',
          tabs
        };
        featureIndex++;
        return placeholder;
      }
    );

    // タイムライン: {{timeline:date1:title1:desc1|date2:title2:desc2}}
    processed = processed.replace(
      /{{timeline:([^}]+)}}/g,
      (match, timelineStr) => {
        const placeholder = `--timeline-${featureIndex}--`;
        const events = timelineStr.split('|').map((event: string) => {
          const [date, title, description] = event.split(':', 3);
          return {
            date: date?.trim() || '',
            title: title?.trim() || '',
            description: description?.trim()
          };
        });
        featureMatches[placeholder] = {
          type: 'timeline',
          events
        };
        featureIndex++;
        return placeholder;
      }
    );

    // アコーディオン: {{accordion:title1:content1|title2:content2}}
    processed = processed.replace(
      /{{accordion:([^}]+)}}/g,
      (match, accordionStr) => {
        const placeholder = `--accordion-${featureIndex}--`;
        const items = accordionStr.split('|').map((item: string) => {
          const [title, content] = item.split(':', 2);
          return {
            title: title?.trim() || '',
            content: content?.trim() || ''
          };
        });
        featureMatches[placeholder] = {
          type: 'accordion',
          items
        };
        featureIndex++;
        return placeholder;
      }
    );

    return { content: processed, featureMatches };
  };

  // null, undefined, 空文字列チェック
  const safeContent = content || '';
  const { content: processedContent, matches: youtubeMatches } = extractYouTubeEmbeds(safeContent);
  const { content: spoilerContent, spoilerMatches } = extractSpoilers(processedContent);
  const { content: calloutContent, calloutMatches } = extractCallouts(spoilerContent);
  const { content: finalContent, featureMatches } = extractEnhancedFeatures(calloutContent);

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

  const renderFeatureComponent = (placeholderText: string) => {
    // オーディオプレイヤー
    const audioMatch = placeholderText.match(/--audio-(\d+)--/);
    if (audioMatch) {
      const featureData = featureMatches[placeholderText];
      if (featureData && featureData.type === 'audio') {
        return (
          <AudioPlayer
            key={placeholderText}
            src={featureData.src}
            title={featureData.title}
          />
        );
      }
    }

    // カウントダウンタイマー
    const countdownMatch = placeholderText.match(/--countdown-(\d+)--/);
    if (countdownMatch) {
      const featureData = featureMatches[placeholderText];
      if (featureData && featureData.type === 'countdown') {
        return (
          <CountdownTimer
            key={placeholderText}
            targetDate={featureData.targetDate}
            title={featureData.title}
          />
        );
      }
    }

    // プログレスバー
    const progressMatch = placeholderText.match(/--progress-(\d+)--/);
    if (progressMatch) {
      const featureData = featureMatches[placeholderText];
      if (featureData && featureData.type === 'progress') {
        return (
          <ProgressBar
            key={placeholderText}
            value={featureData.value}
            max={featureData.max}
            label={featureData.label}
            color={featureData.color}
          />
        );
      }
    }

    // タブ
    const tabsMatch = placeholderText.match(/--tabs-(\d+)--/);
    if (tabsMatch) {
      const featureData = featureMatches[placeholderText];
      if (featureData && featureData.type === 'tabs') {
        return (
          <Tabs
            key={placeholderText}
            tabs={featureData.tabs}
          />
        );
      }
    }

    // タイムライン
    const timelineMatch = placeholderText.match(/--timeline-(\d+)--/);
    if (timelineMatch) {
      const featureData = featureMatches[placeholderText];
      if (featureData && featureData.type === 'timeline') {
        return (
          <Timeline
            key={placeholderText}
            events={featureData.events}
          />
        );
      }
    }

    // アコーディオン
    const accordionMatch = placeholderText.match(/--accordion-(\d+)--/);
    if (accordionMatch) {
      const featureData = featureMatches[placeholderText];
      if (featureData && featureData.type === 'accordion') {
        return (
          <Accordion
            key={placeholderText}
            items={featureData.items}
          />
        );
      }
    }

    return placeholderText;
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
                  const parts = node.split(/(--(?:youtube-embed|spoiler|callout|audio|countdown|progress|tabs|timeline|accordion)-\d+--)/);
                  return parts.map((part, j) => {
                    // YouTube埋め込み
                    if (part.match(/--youtube-embed-\d+--/)) {
                      return renderYouTubeComponent(part);
                    }
                    // スポイラー
                    if (part.match(/--spoiler-\d+--/)) {
                      const spoilerContent = spoilerMatches[part.trim()];
                      return spoilerContent ? <Spoiler key={`${i}-${j}`} content={spoilerContent} /> : part;
                    }
                    // カラウト
                    if (part.match(/--callout-\d+--/)) {
                      const calloutData = calloutMatches[part.trim()];
                      return calloutData ? (
                        <Callout 
                          key={`${i}-${j}`} 
                          type={calloutData.type}
                          content={calloutData.content}
                          title={calloutData.title}
                          collapsible={calloutData.collapsible}
                        />
                      ) : part;
                    }
                    // その他の機能コンポーネント
                    if (part.match(/--(?:audio|countdown|progress|tabs|timeline|accordion)-\d+--/)) {
                      return renderFeatureComponent(part);
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
                child.type === Callout ||
                child.type === AudioPlayer ||
                child.type === CountdownTimer ||
                child.type === ProgressBar ||
                child.type === Tabs ||
                child.type === Timeline ||
                child.type === Accordion
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