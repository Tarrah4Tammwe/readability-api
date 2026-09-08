import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ClientError } from './errors'
import { fetchPublicPage } from './fetch-page'

function jsonResponse(status: number, body: string, headers: Record<string, string> = {}): Response {
  return new Response(body, { status, headers })
}

describe('fetchPublicPage', () => {
  it('refuses redirects to private hosts', async () => {
    const fetchMock = async () =>
      jsonResponse(302, '', { location: 'http://127.0.0.1/secret' })

    await assert.rejects(
      () =>
        fetchPublicPage('https://example.com/start', {
          lookup: async () => ['93.184.216.34'],
          fetch: fetchMock,
        }),
      ClientError
    )
  })

  it('extracts text from a public HTML page', async () => {
    const fetchMock = async () =>
      jsonResponse(200, '<html><body><p>The cat sat on the mat today.</p></body></html>', {
        'content-type': 'text/html',
      })

    const text = await fetchPublicPage('https://example.com/article', {
      lookup: async () => ['93.184.216.34'],
      fetch: fetchMock,
    })
    assert.match(text, /The cat sat on the mat today/)
  })

  it('rejects disallowed content types', async () => {
    const fetchMock = async () => jsonResponse(200, 'PNGDATA', { 'content-type': 'image/png' })
    await assert.rejects(
      () =>
        fetchPublicPage('https://example.com/file.png', {
          lookup: async () => ['93.184.216.34'],
          fetch: fetchMock,
        }),
      ClientError
    )
  })
})
