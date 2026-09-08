import { NextRequest, NextResponse } from 'next/server'
import { ClientError } from './errors'
import { MAX_JSON_BODY_BYTES, MAX_TEXT_CHARS } from './limits'

export function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ success: false, error }, { status })
}

export function handleRouteError(err: unknown): NextResponse {
  if (err instanceof ClientError) {
    return jsonError(err.message, err.status)
  }
  if (err instanceof SyntaxError) {
    return jsonError('Invalid JSON body', 400)
  }
  console.error(err)
  return jsonError('Internal server error', 500)
}

export async function parseJsonObject(req: NextRequest): Promise<Record<string, unknown>> {
  const contentLength = req.headers.get('content-length')
  if (contentLength) {
    const size = Number(contentLength)
    if (Number.isFinite(size) && size > MAX_JSON_BODY_BYTES) {
      throw new ClientError(`Request body must be at most ${MAX_JSON_BODY_BYTES} bytes`, 413)
    }
  }

  let body: unknown
  try {
    body = await req.json()
  } catch (err) {
    if (err instanceof ClientError) throw err
    throw new ClientError('Invalid JSON body')
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ClientError('Request body must be a JSON object')
  }
  return body as Record<string, unknown>
}

export function requireTextField(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new ClientError(`${field} must be a string`)
  }
  if (value.length > MAX_TEXT_CHARS) {
    throw new ClientError(`${field} must be at most ${MAX_TEXT_CHARS} characters`, 413)
  }
  return value
}

export function optionsResponse(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}
