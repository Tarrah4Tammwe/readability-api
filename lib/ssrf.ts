import { lookup as dnsLookup } from 'node:dns/promises'
import { BlockList, isIP } from 'node:net'
import { ClientError } from './errors'
import { ALLOWED_FETCH_PORTS, MAX_URL_LENGTH } from './limits'

export type LookupFn = (hostname: string) => Promise<string[]>

const blocked = new BlockList()
// IPv4 special-use / private / non-routable
blocked.addSubnet('0.0.0.0', 8, 'ipv4')
blocked.addSubnet('10.0.0.0', 8, 'ipv4')
blocked.addSubnet('100.64.0.0', 10, 'ipv4') // CGNAT
blocked.addSubnet('127.0.0.0', 8, 'ipv4')
blocked.addSubnet('169.254.0.0', 16, 'ipv4') // link-local / cloud metadata
blocked.addSubnet('172.16.0.0', 12, 'ipv4')
blocked.addSubnet('192.0.0.0', 24, 'ipv4')
blocked.addSubnet('192.0.2.0', 24, 'ipv4') // TEST-NET-1
blocked.addSubnet('192.168.0.0', 16, 'ipv4')
blocked.addSubnet('198.18.0.0', 15, 'ipv4') // benchmarking
blocked.addSubnet('198.51.100.0', 24, 'ipv4') // TEST-NET-2
blocked.addSubnet('203.0.113.0', 24, 'ipv4') // TEST-NET-3
blocked.addSubnet('224.0.0.0', 4, 'ipv4') // multicast
blocked.addSubnet('240.0.0.0', 4, 'ipv4') // reserved
blocked.addAddress('255.255.255.255', 'ipv4')
// IPv6 special-use
blocked.addAddress('::', 'ipv6')
blocked.addAddress('::1', 'ipv6')
blocked.addSubnet('fc00::', 7, 'ipv6') // unique local
blocked.addSubnet('fe80::', 10, 'ipv6') // link-local
blocked.addSubnet('ff00::', 8, 'ipv6') // multicast
blocked.addSubnet('2001:db8::', 32, 'ipv6') // documentation

const BLOCKED_HOSTS = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.google.internal.',
  'kubernetes.default',
  'kubernetes.default.svc',
  'kubernetes.default.svc.cluster.local',
])

const BLOCKED_HOST_SUFFIXES = [
  '.localhost',
  '.local',
  '.internal',
  '.intranet',
  '.corp',
  '.home',
  '.lan',
  '.localdomain',
]

export function isBlockedIp(ip: string): boolean {
  const version = isIP(ip)
  if (version === 4) return blocked.check(ip, 'ipv4')
  if (version === 6) {
    const mapped = extractIpv4Mapped(ip)
    if (mapped) return isBlockedIp(mapped)
    return blocked.check(ip, 'ipv6')
  }
  return true
}

function extractIpv4Mapped(ip: string): string | null {
  const lower = ip.toLowerCase()
  const dotted = lower.match(/::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (dotted) return dotted[1]
  const hex = lower.match(/::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  if (hex) {
    const hi = parseInt(hex[1], 16)
    const lo = parseInt(hex[2], 16)
    return `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`
  }
  return null
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.replace(/\.$/, '').toLowerCase()
  if (BLOCKED_HOSTS.has(host)) return true
  return BLOCKED_HOST_SUFFIXES.some(suffix => host.endsWith(suffix) || host === suffix.slice(1))
}

function looksLikeNonCanonicalIp(hostname: string): boolean {
  if (isIP(hostname)) return false
  // dword, octal, hex, shortened IPv4 (e.g. 127.1, 2130706433, 0x7f.0.0.1)
  if (/^\d+$/.test(hostname)) return true
  if (/^[\d.]+$/.test(hostname)) return true
  if (/^0x[0-9a-f.]+$/i.test(hostname)) return true
  return false
}

export function parsePublicHttpUrl(raw: string): URL {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new ClientError('url must be a valid http/https URL')
  }
  const trimmed = raw.trim()
  if (trimmed.length > MAX_URL_LENGTH) {
    throw new ClientError(`url must be at most ${MAX_URL_LENGTH} characters`)
  }

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    throw new ClientError('url must be a valid http/https URL')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ClientError('url must be a valid http/https URL')
  }
  if (url.username || url.password) {
    throw new ClientError('url must not include credentials')
  }
  if (!ALLOWED_FETCH_PORTS.has(url.port)) {
    throw new ClientError('url must use port 80 or 443')
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  if (!hostname || isBlockedHostname(hostname) || looksLikeNonCanonicalIp(hostname)) {
    throw new ClientError('url host is not allowed')
  }
  if (isIP(hostname) && isBlockedIp(hostname)) {
    throw new ClientError('url host is not allowed')
  }

  return url
}

async function defaultLookup(hostname: string): Promise<string[]> {
  const results = await dnsLookup(hostname, { all: true, verbatim: true })
  return results.map(r => r.address)
}

export async function assertSafePublicHttpUrl(
  raw: string,
  lookupFn: LookupFn = defaultLookup
): Promise<{ url: URL; addresses: string[] }> {
  const url = parsePublicHttpUrl(raw)
  const hostname = url.hostname.replace(/^\[|\]$/g, '')

  let addresses: string[]
  try {
    addresses = isIP(hostname) ? [hostname] : await lookupFn(hostname)
  } catch {
    throw new ClientError('Unable to resolve URL host')
  }

  if (!addresses.length) {
    throw new ClientError('Unable to resolve URL host')
  }
  if (addresses.some(isBlockedIp)) {
    throw new ClientError('url host is not allowed')
  }

  return { url, addresses }
}
