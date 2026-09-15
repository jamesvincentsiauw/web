'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import type { MediaDTO } from '@/lib/content/types'

export function ProjectImage({ image, href, title, caption }: { image: MediaDTO; href?: string; title: string; caption?: string | null }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const labelId = useId()
  const [open, setOpen] = useState(false)
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    if (!open) return
    const modal = dialog.current
    const overflow = document.body.style.overflow
    modal?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      modal?.close()
      document.body.style.overflow = overflow
    }
  }, [open])

  function close() {
    dialog.current?.close()
    setOpen(false)
    setZoomed(false)
    trigger.current?.focus()
  }

  const thumbnail = (
    // eslint-disable-next-line @next/next/no-img-element -- access-checked CMS media route
    <img src={image.url} alt={image.alt} width={image.width ?? 1200} height={image.height ?? 750} loading="lazy" decoding="async" />
  )

  return (
    <>
      {href ? <Link className="project-image-link" href={href} aria-label={`View project: ${title}`}>{thumbnail}</Link> : thumbnail}
      <div className="project-image-actions">
        <button ref={trigger} className="image-expand" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={`Enlarge image: ${title}`}>Enlarge image</button>
      </div>
      <dialog ref={dialog} className="image-dialog" aria-labelledby={labelId} onCancel={(event) => { event.preventDefault(); close() }} onClick={(event) => { if (event.target === event.currentTarget) close() }}>
        {open && <div className="image-dialog__panel">
          <div className="image-dialog__toolbar">
            <p id={labelId}>{title}</p>
            <button type="button" className="button button--secondary" aria-pressed={zoomed} onClick={() => setZoomed(!zoomed)}>{zoomed ? 'Fit image' : 'Zoom in'}</button>
            <button type="button" className="button button--primary" onClick={close} autoFocus>Close</button>
          </div>
          <div className="image-dialog__viewport" tabIndex={0} role="region" aria-label="Image, scroll to explore when zoomed" data-zoomed={zoomed}>
            {/* eslint-disable-next-line @next/next/no-img-element -- access-checked CMS media route */}
            <img src={image.url} alt={image.alt} width={image.width ?? 1200} height={image.height ?? 750} />
          </div>
          {caption && <p className="meta image-dialog__caption">{caption}</p>}
        </div>}
      </dialog>
    </>
  )
}
