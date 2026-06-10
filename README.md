# Readability API

Score the readability of any English text. Returns 5 industry-standard readability scores, actionable improvement suggestions, sentence-level breakdown, and optional target grade pass/fail — in a single API call.

## Endpoints

### POST /api/analyze

Analyse a single piece of text or a URL.

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| text | string | Yes* | Raw text to analyse |
| url | string | Yes* | Public URL to fetch and analyse |
| target_grade | number | No | Target grade level (1–20). Returns pass/fail result. |

*Either `text` or `url` is required.

**Example — text input:**

```json
{
  "text": "The government announced new plans to reduce energy bills for households. Changes will take effect from next month.",
  "target_grade": 8
}
```

**Example — URL input:**

```json
{
  "url": "https://www.bbc.co.uk/news/uk-politics"
}
```

**Response:**

```json
{
  "success": true,
  "textStats": {
    "wordCount": 47,
    "sentenceCount": 4,
    "characterCount": 261,
    "avgSentenceLength": 11.8,
    "avgSyllablesPerWord": 1.62,
    "polysyllabicWordCount": 8,
    "polysyllabicWordPercentage": 17
  },
  "scores": {
    "fleschReadingEase": {
      "score": 58.1,
      "interpretation": "Fairly difficult",
      "suitableFor": "College students"
    },
    "fleschKincaidGrade": {
      "score": 8.1,
      "interpretation": "US Grade 8 reading level"
    },
    "gunningFog": {
      "score": 11.5,
      "interpretation": "Acceptable"
    },
    "automatedReadabilityIndex": {
      "score": 10.6,
      "interpretation": "Roughly Grade 11 reading level"
    },
    "smogIndex": {
      "score": 10.7,
      "interpretation": "Grade 11 reading level",
      "note": "SMOG is most accurate with 30+ sentences"
    }
  },
  "overall": {
    "averageGradeLevel": 10.2,
    "verdict": "Complex",
    "recommendedFor": "Educated adults",
    "plainEnglishScore": 49
  },
  "suggestions": [
    "17% of your words are polysyllabic. Reducing this below 10% will improve your Gunning Fog and SMOG scores significantly."
  ],
  "sentenceBreakdown": {
    "all": [
      {
        "index": 1,
        "sentence": "The government announced new plans to reduce energy bills.",
        "wordCount": 9,
        "fre": 62.3,
        "grade": 7.8,
        "complexity": "Standard"
      }
    ],
    "hardest": [
      {
        "index": 4,
        "sentence": "Critics have raised concerns about the long-term cost implications for taxpayers.",
        "wordCount": 11,
        "fre": 49.5,
        "grade": 9.1,
        "complexity": "Hard"
      }
    ]
  },
  "targetResult": {
    "passed": false,
    "targetGrade": 8,
    "actualGrade": 10.2,
    "gap": 2.2,
    "message": "Text is 2.2 grade levels above the Grade 8 target. Current level: Grade 10.2."
  }
}
```

---

### POST /api/compare

Compare the readability of two texts side by side.

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| text_a | string | Yes | First text |
| text_b | string | Yes | Second text |

**Example:**

```json
{
  "text_a": "The utilisation of sophisticated terminology necessitates considerable cognitive effort from readers.",
  "text_b": "Using complex words makes text harder to read."
}
```

**Response:**

```json
{
  "success": true,
  "text_a": {
    "fleschReadingEase": 12.4,
    "gradeLevel": 18.2,
    "verdict": "Highly technical",
    "wordCount": 12
  },
  "text_b": {
    "fleschReadingEase": 79.1,
    "gradeLevel": 5.3,
    "verdict": "Easy read",
    "wordCount": 8
  },
  "comparison": {
    "moreReadable": "text_b",
    "easeDifference": 66.7,
    "gradeDifference": 12.9,
    "summary": "text_b is easier to read by 66.7 Flesch points"
  }
}
```

---

## Scores explained

| Score | What it measures | Range |
|---|---|---|
| Flesch Reading Ease | Overall ease of reading | 0–100. Higher = easier. |
| Flesch-Kincaid Grade | US school grade level equivalent | Grade number |
| Gunning Fog Index | Years of education needed to understand | Grade number |
| Automated Readability Index (ARI) | Grade level via character/word ratio | Grade number |
| SMOG Index | Grade level via polysyllabic word density | Grade number |
| Plain English Score | Composite 0–100 score | Higher = simpler |

## Use cases

- **Content teams** — check whether blog posts, landing pages, or emails are readable before publishing
- **Legal and compliance** — verify documents meet plain-English requirements
- **EdTech** — match content to student reading levels
- **SEO tools** — surface readability as a content quality signal
- **A/B testing** — use `/compare` to test which version of copy is more readable
- **Automated pipelines** — integrate into CMS workflows to flag complex content at submission

## Pricing

| Plan | Calls/month | Price |
|---|---|---|
| Free | 100 | $0 |
| Basic | 10,000 | $9/mo |
| Pro | 100,000 | $29/mo |
| Ultra | Unlimited | $79/mo |

## Error responses

```json
{
  "success": false,
  "error": "Provide either \"text\" (string) or \"url\" (string) in the request body"
}
```

All errors return an appropriate HTTP status code (400 for bad input, 500 for server errors) with a plain-English `error` field describing exactly what went wrong.
