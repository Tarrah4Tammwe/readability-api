const MAX_DECODE_PASSES = 2

function decodeBasicEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => safeChar(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => safeChar(Number(num)))
}

function safeChar(code: number): string {
  if (!Number.isFinite(code) || code < 32 || code === 127) return ' '
  if (code > 0x10ffff) return ' '
  try {
    return String.fromCodePoint(code)
  } catch {
    return ' '
  }
}

function stripMarkup(html: string): string {
  return html
    .replace(/<head\b[\s\S]*?(<\/head>|$)/gi, ' ')
    .replace(/<script\b[\s\S]*?(<\/script>|$)/gi, ' ')
    .replace(/<style\b[\s\S]*?(<\/style>|$)/gi, ' ')
    .replace(/<noscript\b[\s\S]*?(<\/noscript>|$)/gi, ' ')
    .replace(/<svg\b[\s\S]*?(<\/svg>|$)/gi, ' ')
    .replace(/<iframe\b[\s\S]*?(<\/iframe>|$)/gi, ' ')
    .replace(/<object\b[\s\S]*?(<\/object>|$)/gi, ' ')
    .replace(/<embed\b[\s\S]*?(<\/embed>|$)/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
}

export function htmlToText(html: string): string {
  let text = html
  for (let i = 0; i < MAX_DECODE_PASSES; i++) {
    text = decodeBasicEntities(text)
    text = stripMarkup(text)
  }
  return text.replace(/\s{2,}/g, ' ').trim()
}
