import { ClientError } from './errors'
import { htmlToText } from './html-text'
import { FETCH_TIMEOUT_MS, MAX_FETCH_BYTES, MAX_REDIRECTS, MAX_TEXT_CHARS } from './limits'
import { assertSafePublicHttpUrl, type LookupFn } from './ssrf'

type FetchFn = (input: string, init?: RequestInit) => Promise<Response>

export type FetchPageDeps = {
  lookup?: LookupFn
  fetch?: FetchFn
}

const ALLOWED_CONTENT_TYPES = [
  'text/html',
  'application/xhtml+xml',
  'text/plain',
  'text/xml',
  'application/xml',
]

function isAllowedContentType(value: string | null): boolean {
  if (!value) return true
  const type = value.split(';')[0].trim().toLowerCase()
  return ALLOWED_CONTENT_TYPES.some(allowed => type === allowed || type.endsWith('+xml'))
}

async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const contentLength = res.headers.get('content-length')
  if (contentLength && Number(contentLength) > maxBytes) {
    throw new ClientError('Fetched page exceeds size limit', 413)
  }
  if (!res.body) return ''

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let received = 0
  let text = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.byteLength
      if (received > maxBytes) {
        try {
          await reader.cancel()
        } catch {
          // ignore
        }
        throw new ClientError('Fetched page exceeds size limit', 413)
      }
      text += decoder.decode(value, { stream: true })
    }
    text += decoder.decode()
  } finally {
    try {
      reader.releaseLock()
    } catch {
      // ignore
    }
  }
  return text
}

function resolveRedirect(current: URL, location: string): string {
  let next: URL
  try {
    next = new URL(location, current)
  } catch {
    throw new ClientError('Failed to fetch URL: invalid redirect')
  }
  return next.toString()
}

export async function fetchPublicPage(rawUrl: string, deps: FetchPageDeps = {}): Promise<string> {
  const fetchFn = deps.fetch ?? fetch
  let current = rawUrl

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertSafePublicHttpUrl(current, deps.lookup)
    let res: Response
    try {
      res = await fetchFn(url.toString(), {
        method: 'GET',
        redirect: 'manual',
        headers: {
          Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.1',
          'User-Agent': 'ReadabilityAPI/1.0',
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
    } catch (err) {
      if (err instanceof ClientError) throw err
      if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        throw new ClientError('Timed out fetching URL', 504)
      }
      throw new ClientError('Failed to fetch URL')
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location')
      if (!location) {
        throw new ClientError(`Failed to fetch URL: HTTP ${res.status}`)
      }
      if (hop === MAX_REDIRECTS) {
        throw new ClientError('Failed to fetch URL: too many redirects')
      }
      current = resolveRedirect(url, location)
      continue
    }

    if (!res.ok) {
      throw new ClientError(`Failed to fetch URL: HTTP ${res.status}`)
    }
    if (!isAllowedContentType(res.headers.get('content-type'))) {
      throw new ClientError('URL did not return HTML or plain text')
    }

    const html = await readCapped(res, MAX_FETCH_BYTES)
    const text = htmlToText(html)
    if (text.length > MAX_TEXT_CHARS) {
      return text.slice(0, MAX_TEXT_CHARS)
    }
    return text
  }

  throw new ClientError('Failed to fetch URL: too many redirects')
}
