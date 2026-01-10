import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 18,
          background: '#0f172a', // slate-900
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#22d3ee', // cyan-400
          borderRadius: '20%',
          fontFamily: 'monospace',
          border: '1px solid #334155',
        }}
      >
        &gt;_
      </div>
    ),
    {
      ...size,
    }
  );
}
