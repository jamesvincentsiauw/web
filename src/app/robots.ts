import type { MetadataRoute } from 'next'

import { absoluteURL } from '@/lib/env'

export const dynamic = 'force-dynamic'

// Crawling hints only. Access control is enforced server-side, not by robots.txt.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/preview/'] },
    sitemap: absoluteURL('/sitemap.xml'),
  }
}
