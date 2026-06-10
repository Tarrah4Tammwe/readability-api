export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 760, margin: '0 auto', padding: '48px 24px', color: '#1a1a1a' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Readability API</h1>
      <p style={{ fontSize: 18, color: '#555', marginBottom: 40 }}>
        Score the readability of any English text. Returns Flesch-Kincaid, Gunning Fog, SMOG, ARI and a plain-English verdict in one call.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Endpoints</h2>

      <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '20px 24px', marginBottom: 24 }}>
        <code style={{ fontWeight: 700 }}>POST /api/analyze</code>
        <p style={{ margin: '8px 0 12px', color: '#444' }}>Analyse a single text. Returns 5 readability scores plus an overall grade level and verdict.</p>
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 16, borderRadius: 6, overflowX: 'auto', fontSize: 13 }}>{`{
  "text": "Your text goes here."
}`}</pre>
      </div>

      <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '20px 24px', marginBottom: 40 }}>
        <code style={{ fontWeight: 700 }}>POST /api/compare</code>
        <p style={{ margin: '8px 0 12px', color: '#444' }}>Compare two texts. Returns scores for both and identifies which is more readable.</p>
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 16, borderRadius: 6, overflowX: 'auto', fontSize: 13 }}>{`{
  "text_a": "First version of your copy.",
  "text_b": "Second version of your copy."
}`}</pre>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Scores returned</h2>
      <ul style={{ lineHeight: 2, color: '#444' }}>
        <li><strong>Flesch Reading Ease</strong> — 0–100 scale. Higher = easier.</li>
        <li><strong>Flesch-Kincaid Grade Level</strong> — US school grade equivalent.</li>
        <li><strong>Gunning Fog Index</strong> — Years of education needed to understand.</li>
        <li><strong>Automated Readability Index (ARI)</strong> — Grade level via character count.</li>
        <li><strong>SMOG Index</strong> — Grade level via polysyllabic word count.</li>
        <li><strong>Plain English Score</strong> — 0–100 composite score.</li>
      </ul>
    </main>
  )
}
