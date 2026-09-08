import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ClientError } from './errors'
import { assertSafePublicHttpUrl, isBlockedIp, parsePublicHttpUrl } from './ssrf'

describe('isBlockedIp', () => {
  it('blocks loopback, private, link-local, and metadata ranges', () => {
    for (const ip of [
      '127.0.0.1',
      '127.255.0.1',
      '10.0.0.5',
      '172.16.0.1',
      '172.31.255.1',
      '192.168.1.1',
      '169.254.169.254',
      '0.0.0.0',
      '100.64.0.1',
      '255.255.255.255',
      '::1',
      '::',
      'fc00::1',
      'fe80::1',
      '::ffff:127.0.0.1',
      '::ffff:7f00:1',
    ]) {
      assert.equal(isBlockedIp(ip), true, ip)
    }
  })

  it('allows public unicast addresses', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '93.184.216.34', '2001:4860:4860::8888']) {
      assert.equal(isBlockedIp(ip), false, ip)
    }
  })
})

describe('parsePublicHttpUrl', () => {
  it('accepts plain http and https URLs including uppercase schemes', () => {
    assert.equal(parsePublicHttpUrl('HTTPS://Example.com/path').protocol, 'https:')
    assert.equal(parsePublicHttpUrl('http://example.com').hostname, 'example.com')
  })

  it('rejects non-http schemes, credentials, and non-standard ports', () => {
    const blocked = [
      'javascript:alert(1)',
      'file:///etc/passwd',
      'ftp://example.com',
      'https://user:pass@example.com',
      'https://example.com:8080',
      'http://example.com:3000',
      'http://127.0.0.1',
      'http://localhost',
      'http://169.254.169.254/latest/meta-data/',
      'http://192.168.0.1',
      'http://10.0.0.1',
      'http://[::1]/',
      'http://2130706433',
      'http://127.1',
      'http://0x7f.0.0.1',
      'http://metadata.google.internal',
      'http://foo.localhost',
    ]
    for (const url of blocked) {
      assert.throws(() => parsePublicHttpUrl(url), ClientError, url)
    }
  })
})

describe('assertSafePublicHttpUrl', () => {
  it('blocks hosts that resolve to private addresses', async () => {
    await assert.rejects(
      () => assertSafePublicHttpUrl('https://evil.example', async () => ['127.0.0.1']),
      ClientError
    )
  })

  it('allows hosts that resolve only to public addresses', async () => {
    const url = await assertSafePublicHttpUrl('https://example.com/page', async () => ['93.184.216.34'])
    assert.equal(url.url.hostname, 'example.com')
  })
})
