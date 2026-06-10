export default function Home() {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0b0b0f; color: #e8e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

        .hero {
          padding: 80px 24px 64px;
          max-width: 860px;
          margin: 0 auto;
        }
        .badge {
          display: inline-block;
          background: rgba(139,92,246,0.15);
          border: 1px solid rgba(139,92,246,0.4);
          color: #a78bfa;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 20px;
          margin-bottom: 24px;
        }
        h1 {
          font-size: clamp(36px, 5vw, 56px);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 20px;
        }
        h1 span {
          background: linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .subtitle {
          font-size: 18px;
          color: #9090a8;
          line-height: 1.6;
          max-width: 560px;
          margin-bottom: 40px;
        }
        .cta-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }
        .btn-primary {
          background: #7c3aed;
          color: #fff;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          transition: background 0.15s;
        }
        .btn-primary:hover { background: #6d28d9; }
        .btn-secondary {
          color: #9090a8;
          font-size: 14px;
          text-decoration: none;
          padding: 12px 4px;
        }

        .section { max-width: 860px; margin: 0 auto; padding: 0 24px 64px; }

        .section-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #7c3aed;
          margin-bottom: 16px;
        }
        h2 { font-size: 28px; font-weight: 700; margin-bottom: 32px; letter-spacing: -0.01em; }

        .scores-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }
        .score-card {
          background: #13131a;
          border: 1px solid #1e1e2e;
          border-radius: 12px;
          padding: 20px;
        }
        .score-card-name {
          font-size: 13px;
          font-weight: 600;
          color: #e8e8f0;
          margin-bottom: 6px;
        }
        .score-card-desc {
          font-size: 12px;
          color: #6060780;
          color: #606078;
          line-height: 1.5;
        }
        .score-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 8px;
          background: #7c3aed;
        }
        .score-dot.blue { background: #3b82f6; }
        .score-dot.green { background: #10b981; }
        .score-dot.orange { background: #f59e0b; }
        .score-dot.pink { background: #ec4899; }
        .score-dot.teal { background: #14b8a6; }

        .endpoint-block {
          background: #13131a;
          border: 1px solid #1e1e2e;
          border-radius: 12px;
          margin-bottom: 16px;
          overflow: hidden;
        }
        .endpoint-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid #1e1e2e;
        }
        .method-badge {
          background: rgba(139,92,246,0.2);
          color: #a78bfa;
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 12px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .endpoint-path {
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 14px;
          color: #e8e8f0;
          font-weight: 500;
        }
        .endpoint-desc {
          padding: 12px 20px 0;
          font-size: 13px;
          color: #9090a8;
          line-height: 1.5;
        }
        .code-block {
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 13px;
          line-height: 1.7;
          padding: 20px;
          color: #c9d1d9;
          overflow-x: auto;
        }
        .key { color: #79c0ff; }
        .val { color: #a5d6ff; }
        .str { color: #a8ff78; }
        .num { color: #f78166; }
        .comment { color: #484860; }

        .divider {
          border: none;
          border-top: 1px solid #1e1e2e;
          margin: 0 20px;
        }

        .response-block {
          background: #0d0d12;
          border: 1px solid #1e1e2e;
          border-radius: 12px;
          overflow: hidden;
        }
        .response-header {
          padding: 12px 20px;
          border-bottom: 1px solid #1e1e2e;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; }
        .status-text { font-size: 12px; color: #10b981; font-weight: 600; font-family: monospace; }

        .footer {
          max-width: 860px;
          margin: 0 auto;
          padding: 32px 24px 64px;
          border-top: 1px solid #1e1e2e;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        .footer-text { font-size: 13px; color: #40405a; }
        .footer-links { display: flex; gap: 24px; }
        .footer-links a { font-size: 13px; color: #60607a; text-decoration: none; }
        .footer-links a:hover { color: #a78bfa; }
      `}</style>

      {/* Hero */}
      <div className="hero">
        <div className="badge">REST API</div>
        <h1>
          Score text<br />
          <span>readability instantly</span>
        </h1>
        <p className="subtitle">
          Send any English text, get back Flesch-Kincaid, Gunning Fog, SMOG, ARI scores and a plain-English verdict in one API call.
        </p>
        <div className="cta-row">
          <a className="btn-primary" href="https://rapidapi.com" target="_blank" rel="noopener">Try on RapidAPI</a>
          <a className="btn-secondary" href="/api/analyze">View endpoint →</a>
        </div>
      </div>

      {/* Scores */}
      <div className="section">
        <p className="section-label">What you get</p>
        <h2>5 scores. One call.</h2>
        <div className="scores-grid">
          <div className="score-card">
            <div className="score-card-name"><span className="score-dot"></span>Flesch Reading Ease</div>
            <div className="score-card-desc">0–100 scale. Higher = easier to read. The most widely used readability measure.</div>
          </div>
          <div className="score-card">
            <div className="score-card-name"><span className="score-dot blue"></span>Flesch-Kincaid Grade</div>
            <div className="score-card-desc">US school grade equivalent. Grade 8 = readable by most adults.</div>
          </div>
          <div className="score-card">
            <div className="score-card-name"><span className="score-dot green"></span>Gunning Fog Index</div>
            <div className="score-card-desc">Years of formal education needed to understand the text on a first pass.</div>
          </div>
          <div className="score-card">
            <div className="score-card-name"><span className="score-dot orange"></span>ARI</div>
            <div className="score-card-desc">Automated Readability Index. Grade level via character-to-word ratio.</div>
          </div>
          <div className="score-card">
            <div className="score-card-name"><span className="score-dot pink"></span>SMOG Index</div>
            <div className="score-card-desc">Grade level based on polysyllabic word density. Reliable for healthcare and legal text.</div>
          </div>
          <div className="score-card">
            <div className="score-card-name"><span className="score-dot teal"></span>Plain English Score</div>
            <div className="score-card-desc">0–100 composite score. 80+ = suitable for general public.</div>
          </div>
        </div>
      </div>

      {/* Endpoints */}
      <div className="section">
        <p className="section-label">Endpoints</p>
        <h2>Two endpoints. Simple integration.</h2>

        <div className="endpoint-block">
          <div className="endpoint-header">
            <span className="method-badge">POST</span>
            <span className="endpoint-path">/api/analyze</span>
          </div>
          <p className="endpoint-desc">Analyse a single piece of text. Returns all 5 scores plus text statistics and an overall verdict.</p>
          <div className="code-block">
            <span className="comment">// Request body</span>{'\n'}
            {'{'}{'\n'}
            {'  '}<span className="key">"text"</span>: <span className="str">"Your content goes here."</span>{'\n'}
            {'}'}
          </div>
        </div>

        <div className="endpoint-block">
          <div className="endpoint-header">
            <span className="method-badge">POST</span>
            <span className="endpoint-path">/api/compare</span>
          </div>
          <p className="endpoint-desc">Compare two texts side by side. Identifies which is more readable and by how many grade levels.</p>
          <div className="code-block">
            <span className="comment">// Request body</span>{'\n'}
            {'{'}{'\n'}
            {'  '}<span className="key">"text_a"</span>: <span className="str">"Original version of your copy."</span>,{'\n'}
            {'  '}<span className="key">"text_b"</span>: <span className="str">"Simplified version of your copy."</span>{'\n'}
            {'}'}
          </div>
        </div>
      </div>

      {/* Example response */}
      <div className="section">
        <p className="section-label">Response</p>
        <h2>Clean JSON, every time.</h2>
        <div className="response-block">
          <div className="response-header">
            <span className="status-dot"></span>
            <span className="status-text">200 OK</span>
          </div>
          <div className="code-block">
            {'{'}{'\n'}
            {'  '}<span className="key">"success"</span>: <span className="num">true</span>,{'\n'}
            {'  '}<span className="key">"textStats"</span>: {'{'}{'\n'}
            {'    '}<span className="key">"wordCount"</span>: <span className="num">142</span>,{'\n'}
            {'    '}<span className="key">"sentenceCount"</span>: <span className="num">8</span>,{'\n'}
            {'    '}<span className="key">"avgSentenceLength"</span>: <span className="num">17.8</span>{'\n'}
            {'  '}{'}'},{'\n'}
            {'  '}<span className="key">"scores"</span>: {'{'}{'\n'}
            {'    '}<span className="key">"fleschReadingEase"</span>: {'{ '}<span className="key">"score"</span>: <span className="num">62.4</span>, <span className="key">"interpretation"</span>: <span className="str">"Standard"</span>{' }'},{'\n'}
            {'    '}<span className="key">"fleschKincaidGrade"</span>: {'{ '}<span className="key">"score"</span>: <span className="num">9.1</span>, <span className="key">"interpretation"</span>: <span className="str">"US Grade 9 reading level"</span>{' }'},{'\n'}
            {'    '}<span className="key">"gunningFog"</span>: {'{ '}<span className="key">"score"</span>: <span className="num">11.2</span>, <span className="key">"interpretation"</span>: <span className="str">"Acceptable"</span>{' }'}{'\n'}
            {'  '}{'}'},{'\n'}
            {'  '}<span className="key">"overall"</span>: {'{'}{'\n'}
            {'    '}<span className="key">"averageGradeLevel"</span>: <span className="num">10.4</span>,{'\n'}
            {'    '}<span className="key">"verdict"</span>: <span className="str">"Moderate"</span>,{'\n'}
            {'    '}<span className="key">"recommendedFor"</span>: <span className="str">"Adults with average education"</span>,{'\n'}
            {'    '}<span className="key">"plainEnglishScore"</span>: <span className="num">48</span>{'\n'}
            {'  '}{'}'}{'\n'}
            {'}'}
          </div>
        </div>
      </div>

      <footer className="footer">
        <span className="footer-text">Readability API — built for developers</span>
        <div className="footer-links">
          <a href="/api/analyze">Docs</a>
          <a href="https://rapidapi.com" target="_blank" rel="noopener">RapidAPI</a>
        </div>
      </footer>
    </>
  )
}
