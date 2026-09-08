import { isIP } from 'node:net'
import { Agent, fetch as undiciFetch } from 'undici'
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

async function pinnedFetch(
  url: URL,
  addresses: string[],
  init: RequestInit
): Promise<{ res: Response; agent: Agent }> {
  const agent = new Agent({
    connect: {
      lookup(_hostname, opts, cb) {
        const callback = (typeof opts === 'function' ? opts : cb) as (
          err: Error | null,
          address?: string | Array<{ address: string; family: number }>,
          family?: number
        ) => void
        const options = typeof opts === 'function' ? {} : opts
        const want4 = options.family === 4
        const want6 = options.family === 6
        const match = addresses.find(addr => {
          const version = isIP(addr)
          if (want4) return version === 4
          if (want6) return version === 6
          return version === 4 || version === 6
        })
        if (!match) {
          callback(new Error('No allowed addresses'))
          return
        }
        const family = isIP(match) === 6 ? 6 : 4
        if (options.all) {
          callback(null, [{ address: match, family }])
          return
        }
        callback(null, match, family)
      },
    },
  })
  const headers = new Headers(init.headers)
  const res = (await undiciFetch(url.toString(), {
    method: init.method,
    headers,
    signal: init.signal ?? undefined,
    redirect: 'manual',
    dispatcher: agent,
  })) as unknown as Response
  return { res, agent }
}

export async function fetchPublicPage(rawUrl: string, deps: FetchPageDeps = {}): Promise<string> {
  let current = rawUrl

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const { url, addresses } = await assertSafePublicHttpUrl(current, deps.lookup)
    let res: Response
    let agent: Agent | undefined
    try {
      const init: RequestInit = {
        method: 'GET',
        redirect: 'manual',
        headers: {
          Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.1',
          'User-Agent': 'ReadabilityAPI/1.0',
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      }
      if (deps.fetch) {
        res = await deps.fetch(url.toString(), init)
      } else {
        const pinned = await pinnedFetch(url, addresses, init)
        res = pinned.res
        agent = pinned.agent
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
    } catch (err) {
      if (err instanceof ClientError) throw err
      if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        throw new ClientError('Timed out fetching URL', 504)
      }
      console.error('fetchPublicPage failed')
      throw new ClientError('Failed to fetch URL')
    } finally {
      if (agent) void agent.close()
    }
  }

  throw new ClientError('Failed to fetch URL: too many redirects')
}
