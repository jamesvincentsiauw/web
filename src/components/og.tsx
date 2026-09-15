import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }

/** Simple typographic social image built from published name/title text. No photos or logos. */
export function renderOgImage({ eyebrow, title }: { eyebrow: string; title: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: '#F7F6F3',
          color: '#242722',
          fontFamily: 'serif',
        }}
      >
        <div style={{ fontSize: 32, color: '#5D6259', fontFamily: 'sans-serif' }}>{eyebrow}</div>
        <div style={{ fontSize: title.length > 60 ? 64 : 80, lineHeight: 1.08, letterSpacing: '-0.02em', maxWidth: 1000 }}>{title}</div>
        <div style={{ width: 96, height: 4, background: '#365C42' }} />
      </div>
    ),
    OG_SIZE,
  )
}
