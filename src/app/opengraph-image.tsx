import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'AI Contests Navigator';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#020617', // slate-950
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'monospace',
          position: 'relative',
        }}
      >
        {/* Background Grid Accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            opacity: 0.5,
          }}
        />

        {/* Gradient Glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '400px',
            background:
              'radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(59,130,246,0.05) 50%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Main Terminal Window */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '900px',
            height: '450px',
            backgroundColor: '#0f172a', // slate-900
            borderRadius: '12px',
            border: '1px solid #334155', // slate-700
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            zIndex: 10,
            overflow: 'hidden',
          }}
        >
          {/* Terminal Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 20px',
              borderBottom: '1px solid #1e293b',
              backgroundColor: '#1e293b',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                }}
              />
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: '#eab308',
                }}
              />
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                }}
              />
            </div>
            <div style={{ marginLeft: '16px', color: '#94a3b8', fontSize: 14 }}>
              nav — -zsh — 80x24
            </div>
          </div>

          {/* Terminal Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '40px',
              gap: '20px',
              color: '#f1f5f9',
            }}
          >
            {/* Command */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: 28,
                marginBottom: '10px',
              }}
            >
              <span style={{ color: '#22d3ee' }}>➜</span>
              <span style={{ color: '#94a3b8' }}>~</span>
              <span style={{ color: '#f8fafc' }}>nav list --all</span>
            </div>

            {/* Output */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                fontSize: 24,
                color: '#cbd5e1',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    background: '#eab308',
                    borderRadius: '50%',
                  }}
                />
                <div style={{ width: '150px', color: '#64748b' }}>Kaggle</div>
                <div>Active Competitions Found...</div>
              </div>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    background: '#3b82f6',
                    borderRadius: '50%',
                  }}
                />
                <div style={{ width: '150px', color: '#64748b' }}>
                  DrivenData
                </div>
                <div>Social Impact Challenges...</div>
              </div>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    background: '#ec4899',
                    borderRadius: '50%',
                  }}
                />
                <div style={{ width: '150px', color: '#64748b' }}>Civitai</div>
                <div>Generative AI Models...</div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginTop: '20px',
                  color: '#22c55e',
                }}
              >
                <div>✓</div>
                <div>Found 150+ Contests across 7 platforms</div>
              </div>
              <div style={{ color: '#64748b', fontSize: 20 }}>_</div>
            </div>
          </div>
        </div>

        {/* Footer Branding */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            color: '#475569',
            fontSize: 24,
            letterSpacing: '4px',
            fontWeight: 'bold',
          }}
        >
          AI CONTESTS NAVIGATOR
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
