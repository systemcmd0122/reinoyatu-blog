import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // ?title=<title>
    const title = searchParams.get('title') || '例のヤツ｜ブログ';
    const author = searchParams.get('author') || '';

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
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              padding: '40px 80px',
              borderRadius: '40px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
              border: '1px solid #eee',
              maxWidth: '80%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#000',
                  borderRadius: '8px',
                }}
              />
              <span style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '-0.05em' }}>
                REINOYATU
              </span>
            </div>

            <div
              style={{
                fontSize: '60px',
                fontWeight: '900',
                textAlign: 'center',
                color: '#000',
                lineHeight: '1.2',
                marginBottom: author ? '20px' : '0',
                wordBreak: 'break-word',
              }}
            >
              {title}
            </div>

            {author && (
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '500',
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#eee' }} />
                by {author}
              </div>
            )}
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
            }}
          >
            reinoyatu.vercel.app
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
