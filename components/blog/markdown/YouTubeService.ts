import axios from 'axios';

export interface YouTubeVideoDetails {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
}

class YouTubeService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey || '';
  }
  
  // YouTubeのビデオIDが有効かチェックするメソッド
  validateVideoId(videoId: string): boolean {
    // 11文字の英数字とアンダースコア、ハイフンで構成されているか確認
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
  }
  
  async getVideoDetails(videoId: string): Promise<YouTubeVideoDetails> {
    if (!this.validateVideoId(videoId)) {
      throw new Error('無効な動画IDです');
    }
    
    if (!this.apiKey) {
      return this.getFallbackVideoDetails(videoId);
    }
    
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos`, {
          params: {
            part: 'snippet',
            id: videoId,
            key: this.apiKey
          }
        }
      );
      
      if (response.data.items && response.data.items.length > 0) {
        const videoData = response.data.items[0];
        const snippet = videoData.snippet;
        
        return {
          id: videoId,
          title: snippet.title,
          description: snippet.description,
          thumbnailUrl: snippet.thumbnails.high.url,
          channelTitle: snippet.channelTitle,
          publishedAt: snippet.publishedAt
        };
      }
      
      return this.getFallbackVideoDetails(videoId);
    } catch (error) {
      console.error('YouTube API error:', error);
      return this.getFallbackVideoDetails(videoId);
    }
  }
  
  // APIキーがない場合やAPIエラー時のフォールバック
  private getFallbackVideoDetails(videoId: string): YouTubeVideoDetails {
    return {
      id: videoId,
      title: "YouTube Video",
      description: "詳細情報は利用できません",
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      channelTitle: "YouTube Channel",
      publishedAt: new Date().toISOString()
    };
  }
}

// 環境変数からAPIキーを取得し、undefined の場合は空文字列をセット
const YOUTUBE_API_KEY = (typeof window !== 'undefined' 
  ? process.env.NEXT_PUBLIC_YOUTUBE_API_KEY 
  : '') ?? '';

const youtubeService = new YouTubeService(YOUTUBE_API_KEY);

export default youtubeService;
