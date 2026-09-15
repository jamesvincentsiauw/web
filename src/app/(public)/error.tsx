'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <div className="container status-page" role="alert">
      <h1 className="page-title">This page could not be loaded.</h1>
      <p className="lead">Try again, or go back to the homepage.</p>
      <div className="actions">
        <button
          type="button"
          className="button button--primary"
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              router.refresh()
              reset()
            })
          }
        >
          {pending ? 'Retrying…' : 'Retry'}
        </button>
        <Link className="button button--secondary" href="/">
          Home
        </Link>
      </div>
    </div>
  )
}
