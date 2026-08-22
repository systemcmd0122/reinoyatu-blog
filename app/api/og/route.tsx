import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    // ?title=<title>
    const title = searchParams.get('title')?.slice(0, 100) || '無題の記事'
    const author = searchParams.get('author')?.slice(0, 50) || '例のヤツ'
    const avatar = searchParams.get('avatar')
    const image = searchParams.get('image')
    const likes = searchParams.get('likes') || '0'
    const readingTime = searchParams.get('readingTime') || ''

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            backgroundImage: 'radial-gradient(circle at 25px 25px, #f1f1f1 2%, transparent 0%), radial-gradient(circle at 75px 75px, #f1f1f1 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            padding: '40px 80px',
          }}
        >
          {image && (
            <img
              src={image}
              alt="cover"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.15,
              }}
            />
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '40px 60px',
              borderRadius: '40px',
              border: '2px solid #eee',
              boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
              maxWidth: '90%',
            }}
          >
            <div
              style={{
                fontSize: 60,
                fontWeight: 900,
                color: '#111',
                textAlign: 'center',
                lineHeight: 1.2,
                marginBottom: 30,
                fontFamily: 'sans-serif',
              }}
            >
              {title}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {avatar && (
                <img
                  src={avatar}
                  alt="avatar"
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    marginRight: 15,
                    border: '2px solid #eee',
                  }}
                />
              )}
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#666',
                }}
              >
                by {author}
              </div>
            </div>

            {/* いいね数・読了時間 */}
            {(Number(likes) > 0 || readingTime) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 24,
                  marginTop: 20,
                  fontSize: 20,
                  fontWeight: 600,
                  color: '#888',
                }}
              >
                {Number(likes) > 0 && (
                  <span style={{ color: '#ef4444' }}>♥ {likes}</span>
                )}
                {readingTime && (
                  <span>📖 {readingTime}分</span>
                )}
              </div>
            )}
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 40,
              right: 60,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: '#3b82f6',
                letterSpacing: '-0.05em',
              }}
            >
              例のヤツ｜ブログ
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=604800',
        },
      }
    )
  } catch (e: any) {
    console.log(`${e.message}`)
    // エラー時にプレースホルダー画像を返す
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: '#999',
              textAlign: 'center',
            }}
          >
            例のヤツ｜ブログ
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=604800',
        },
      }
    )
  }
}
