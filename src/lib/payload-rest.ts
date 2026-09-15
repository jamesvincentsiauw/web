import { restoreAsDraftURL } from './request-policy'

type RestHandler = (request: Request, context: { params: Promise<{ slug: string[] }> }) => Promise<Response>

/**
 * AC-12: every REST version restore becomes a draft restore. Payload reads `draft` from the request
 * URL, so the request is rebuilt with draft=true before it reaches the Payload handler. This also
 * covers the admin "Restore" button, which omits draft=true when the document is already a draft.
 */
export function withDraftRestore(handler: RestHandler): RestHandler {
  return (request, context) => {
    const draftURL = restoreAsDraftURL(request.method, new URL(request.url))
    if (!draftURL) return handler(request, context)
    const rebuilt = new Request(draftURL, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      duplex: 'half',
    } as RequestInit)
    return handler(rebuilt, context)
  }
}
