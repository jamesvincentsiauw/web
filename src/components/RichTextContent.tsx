import type { SerializedLinkNode, SerializedUploadNode } from '@payloadcms/richtext-lexical'
import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'

import type { MediaMap, RichTextValue } from '@/lib/content/types'
import { isSafeRichTextHref, relationId, richTextHasContent } from '@/lib/validation'

type Props = {
  value: RichTextValue | null
  media: MediaMap
  className?: string
}

/**
 * Renders limited Lexical content. Headings shift one level down because each rich text block
 * sits under its own section heading. Unsafe links render as plain text; uploads render only when
 * the reader is allowed to see the file.
 */
export function RichTextContent({ value, media, className = 'prose' }: Props) {
  if (!value || !richTextHasContent(value)) return null

  const renderLink = ({ node, nodesToJSX }: { node: SerializedLinkNode; nodesToJSX: (args: { nodes: SerializedLinkNode['children'] }) => React.ReactNode[] }) => {
    const children = nodesToJSX({ nodes: node.children })
    const url = node.fields?.url
    if (node.fields?.linkType === 'internal' || !isSafeRichTextHref(url)) return <>{children}</>
    const newTab = Boolean(node.fields?.newTab) && !url.startsWith('mailto:')
    return (
      <a href={url} {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    )
  }

  const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
    ...defaultConverters,
    heading: ({ node, nodesToJSX }) => {
      const Tag = node.tag === 'h2' ? 'h3' : 'h4'
      return <Tag>{nodesToJSX({ nodes: node.children })}</Tag>
    },
    link: renderLink,
    autolink: renderLink as never,
    upload: ({ node }: { node: SerializedUploadNode }) => {
      const id = relationId(node.value)
      const file = id !== null ? media[id] : undefined
      if (!file || !file.mimeType.startsWith('image/')) return null
      const caption = (node.fields as { caption?: string } | undefined)?.caption || file.caption
      return (
        <figure className="figure">
          {/* eslint-disable-next-line @next/next/no-img-element -- served via access-checked /media route */}
          <img src={file.url} alt={file.alt} width={file.width ?? undefined} height={file.height ?? undefined} loading="lazy" decoding="async" />
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      )
    },
  })

  return <RichText data={value} converters={converters} className={className} disableIndent disableTextAlign />
}
