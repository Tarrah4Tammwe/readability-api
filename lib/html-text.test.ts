import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { htmlToText } from './html-text'

describe('htmlToText', () => {
  it('strips scripts, styles, and tags while decoding entities', () => {
    const html = `
      <html><head><title>Secret</title><script>alert('xss')</script></head>
      <body>
        <style>.x{color:red}</style>
        <p>Hello&nbsp;&amp;&nbsp;world</p>
      </body></html>
    `
    const text = htmlToText(html)
    assert.equal(text.includes('alert'), false)
    assert.equal(text.includes('color:red'), false)
    assert.match(text, /Hello & world/)
  })

  it('strips unclosed script blocks', () => {
    const text = htmlToText('<script>document.cookie=1')
    assert.equal(text.includes('document.cookie'), false)
  })

  it('does not revive encoded script tags as markup', () => {
    const text = htmlToText('&lt;script&gt;document.cookie=1&lt;/script&gt;Hello world')
    assert.equal(text.includes('document.cookie'), false)
    assert.match(text, /Hello world/)
  })
})
