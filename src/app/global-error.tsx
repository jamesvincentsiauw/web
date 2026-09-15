'use client'

import Link from 'next/link'

/** Last-resort boundary when the public layout itself fails (for example, the database is down). */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#F7F6F3', color: '#242722', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ maxWidth: 720, padding: '64px 20px' }} role="alert">
          <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 40, lineHeight: 1.1, margin: 0 }}>
            This page could not be loaded.
          </h1>
          <p style={{ marginTop: 16 }}>Try again, or go back to the homepage.</p>
          <p style={{ display: 'flex', gap: 16, marginTop: 24 }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{ minHeight: 44, padding: '0 20px', background: '#242722', color: '#F7F6F3', border: 0, borderRadius: 4, font: 'inherit' }}
            >
              Retry
            </button>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, color: '#365C42' }}>
              Home
            </Link>
          </p>
        </main>
      </body>
    </html>
  )
}
