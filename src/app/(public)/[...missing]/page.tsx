import { notFound } from 'next/navigation'

/** Sends unmatched public URLs to the styled 404 inside the public layout. */
export default function CatchAll() {
  notFound()
}
