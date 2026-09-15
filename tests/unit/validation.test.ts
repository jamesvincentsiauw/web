import { describe, expect, it } from 'vitest'

import { formatPeriod } from '@/lib/content/queries'
import { parsePreviewParams, previewPath, safeExitPath } from '@/lib/preview'
import { consumeRateLimit, resetRateLimits } from '@/lib/rate-limit'
import { matchRateLimitRule, restoreAsDraftURL } from '@/lib/request-policy'
import {
  checkUpload,
  collectRichTextUploadIds,
  findUnsafeRichTextLinks,
  formatMonth,
  isValidMonth,
  richTextHasContent,
  slugError,
  sniffMimeType,
} from '@/lib/validation'

import { MINIMAL_PDF, PNG_1PX, richText } from '../helpers'

describe('months', () => {
  it('accepts real YYYY-MM months only', () => {
    expect(isValidMonth('2024-10')).toBe(true)
    expect(isValidMonth('2024-13')).toBe(false)
    expect(isValidMonth('2024-1')).toBe(false)
    expect(isValidMonth('Oct 2024')).toBe(false)
  })

  it('formats without timezone conversion and marks current roles as Present', () => {
    expect(formatMonth('2024-01')).toBe('Jan 2024')
    expect(formatPeriod('2024-10', null, true)).toBe('Oct 2024 – Present')
    expect(formatPeriod('2021-10', '2022-01')).toBe('Oct 2021 – Jan 2022')
    expect(formatPeriod(null, null)).toBeNull()
  })
})

describe('slugs', () => {
  it('requires lowercase kebab-case and rejects reserved words', () => {
    expect(slugError('ai-workflow-builder')).toBeNull()
    expect(slugError('AI-Builder')).not.toBeNull()
    expect(slugError('double--hyphen')).not.toBeNull()
    expect(slugError('admin')).not.toBeNull()
    expect(slugError('')).not.toBeNull()
  })
})

describe('uploads', () => {
  it('detects file signatures', () => {
    expect(sniffMimeType(PNG_1PX)).toBe('image/png')
    expect(sniffMimeType(MINIMAL_PDF)).toBe('application/pdf')
    expect(sniffMimeType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull()
  })

  it('rejects SVG, spoofed types, double extensions, and oversized files', () => {
    const file = (name: string, mimetype: string, data: Buffer, size = data.length) => ({ name, mimetype, data, size })
    expect(checkUpload(file('cv.pdf', 'application/pdf', MINIMAL_PDF)).ok).toBe(true)
    expect(checkUpload(file('logo.svg', 'image/svg+xml', Buffer.from('<svg/>'))).ok).toBe(false)
    expect(checkUpload(file('fake.png', 'image/png', MINIMAL_PDF)).ok).toBe(false)
    expect(checkUpload(file('shell.php.png', 'image/png', PNG_1PX)).ok).toBe(false)
    expect(checkUpload(file('photo.pdf', 'image/png', PNG_1PX)).ok).toBe(false)
    expect(checkUpload(file('big.png', 'image/png', PNG_1PX, 9 * 1024 * 1024)).ok).toBe(false)
    expect(checkUpload(file('big.pdf', 'application/pdf', MINIMAL_PDF, 11 * 1024 * 1024)).ok).toBe(false)
  })
})

describe('rich text inspection', () => {
  it('treats empty editor state as missing content', () => {
    expect(richTextHasContent(richText('  '))).toBe(false)
    expect(richTextHasContent(richText('Real text'))).toBe(true)
    expect(richTextHasContent(null)).toBe(false)
  })

  it('flags non-http links and collects upload ids', () => {
    const value = {
      root: {
        type: 'root',
        children: [
          { type: 'link', fields: { url: 'javascript:alert(1)', linkType: 'custom' }, children: [] },
          { type: 'link', fields: { url: 'https://example.com', linkType: 'custom' }, children: [] },
          { type: 'upload', relationTo: 'media', value: 7 },
          { type: 'upload', relationTo: 'media', value: { id: 9 } },
        ],
      },
    }
    expect(findUnsafeRichTextLinks(value)).toEqual(['javascript:alert(1)'])
    expect(collectRichTextUploadIds(value).sort()).toEqual([7, 9])
  })
})

describe('preview routing', () => {
  it('accepts only allowlisted targets and never external destinations', () => {
    expect(parsePreviewParams(new URLSearchParams('collection=projects&id=12'))).toEqual({ kind: 'collection', collection: 'projects', id: 12 })
    expect(parsePreviewParams(new URLSearchParams('global=profile'))).toEqual({ kind: 'global', global: 'profile' })
    expect(parsePreviewParams(new URLSearchParams('collection=users&id=1'))).toBeNull()
    expect(parsePreviewParams(new URLSearchParams('collection=projects&id=1&redirect=https://evil.test'))).toBeNull()
    expect(parsePreviewParams(new URLSearchParams('collection=projects&id=abc'))).toBeNull()
    expect(previewPath({ kind: 'collection', collection: 'projects', id: 3 })).toBe('/preview/projects/3')
  })

  it('exits preview only to public internal paths', () => {
    expect(safeExitPath('/projects/abc')).toBe('/projects/abc')
    expect(safeExitPath('https://evil.test')).toBe('/')
    expect(safeExitPath('//evil.test')).toBe('/')
    expect(safeExitPath('/admin/collections/projects')).toBe('/')
    expect(safeExitPath('/preview/projects/1')).toBe('/')
    expect(safeExitPath(null)).toBe('/')
  })
})

describe('request policy', () => {
  it('rewrites every REST restore to draft=true (AC-12)', () => {
    expect(restoreAsDraftURL('POST', new URL('http://x/api/projects/versions/5'))?.searchParams.get('draft')).toBe('true')
    expect(restoreAsDraftURL('POST', new URL('http://x/api/globals/profile/versions/5?draft=false'))?.searchParams.get('draft')).toBe('true')
    expect(restoreAsDraftURL('POST', new URL('http://x/api/projects/versions/5?draft=true'))).toBeNull()
    expect(restoreAsDraftURL('GET', new URL('http://x/api/projects/versions/5'))).toBeNull()
    expect(restoreAsDraftURL('POST', new URL('http://x/api/projects'))).toBeNull()
  })

  it('rate limits login, reset, and uploads', () => {
    resetRateLimits()
    expect(matchRateLimitRule('POST', '/api/users/login')?.key).toBe('login')
    expect(matchRateLimitRule('POST', '/api/users/forgot-password')?.key).toBe('forgot')
    expect(matchRateLimitRule('POST', '/api/media')?.key).toBe('upload')
    expect(matchRateLimitRule('GET', '/api/projects')).toBeNull()
    const results = Array.from({ length: 11 }, () => consumeRateLimit('login:1.2.3.4', 10, 60_000, 1_000))
    expect(results.filter(Boolean)).toHaveLength(10)
    expect(consumeRateLimit('login:1.2.3.4', 10, 60_000, 70_000)).toBe(true)
  })
})
