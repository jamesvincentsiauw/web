'use client'

import { useState } from 'react'

export function CopyEmail({ email }: { email: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  async function copy() {
    try {
      await navigator.clipboard.writeText(email)
      setStatus('copied')
    } catch {
      setStatus('failed')
    }
  }

  return (
    <>
      <button type="button" className="icon-button" onClick={copy} aria-label="Copy email" title="Copy email">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
          {status === 'copied' ? (
            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <g fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
            </g>
          )}
        </svg>
      </button>
      <p className="copy-status" role="status" aria-live="polite">
        {status === 'copied' ? 'Email copied' : status === 'failed' ? 'Select and copy the email address' : ''}
      </p>
    </>
  )
}
