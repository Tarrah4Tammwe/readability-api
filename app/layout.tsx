import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Readability API — Text Scoring for Developers',
  description:
    'REST API for scoring text readability. Returns Flesch-Kincaid, Gunning Fog, SMOG, ARI scores and plain-English verdicts. Simple integration, clean JSON.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
