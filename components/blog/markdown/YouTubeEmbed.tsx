import React, { useEffect, useState } from 'react';
import youtubeService, { YouTubeVideoDetails } from './YouTubeService';
import { Skeleton } from '@/components/ui/skeleton';

interface YouTubeEmbedProps {
  videoId: string;
  showDetails?: boolean;
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ videoId, showDetails = true }) => {
  const [videoDetails, setVideoDetails] = useState<YouTubeVideoDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      if (!videoId) return;
      
      try {
        setLoading(true);
        const details = await youtubeService.getVideoDetails(videoId);
        setVideoDetails(details);
      } catch (err) {
        setError('動画情報の取得に失敗しました');
        console.error('Error fetching video details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoDetails();
  }, [videoId]);

  if (error) {
    return (
      <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-500">{error}</p>
        <p className="text-sm text-gray-600">Video ID: {videoId}</p>
      </div>
    );
  }

  return (
    <div className="w-full mb-6 bg-gray-50 rounded-lg overflow-hidden border">
      {/* 動画プレーヤー */}
      <div className="relative w-full pt-[56.25%]">
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={videoDetails?.title || "YouTube video"}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      
      {/* 動画情報セクション */}
      {showDetails && (
        <div className="p-4">
          {loading ? (
            <>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </>
          ) : (
            <>
              {videoDetails && (
                <>
                  <h3 className="text-lg font-semibold mb-2">{videoDetails.title}</h3>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <span>{videoDetails.channelTitle}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(videoDetails.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{videoDetails.description}</p>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default YouTubeEmbed;