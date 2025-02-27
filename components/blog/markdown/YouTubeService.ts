import axios from 'axios';

interface YouTubeVideoDetails {
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
    this.apiKey = apiKey;
  }
  
  async getVideoDetails(videoId: string): Promise<YouTubeVideoDetails | null> {
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
      
      return null;
    } catch (error) {
      console.error('YouTube API error:', error);
      return null;
    }
  }
}

// 環境変数からAPIキーを取得するか、設定ファイルから読み込む
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';
const youtubeService = new YouTubeService(YOUTUBE_API_KEY);

export default youtubeService;
export type { YouTubeVideoDetails };