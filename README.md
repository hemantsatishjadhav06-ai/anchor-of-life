# Anchor of Life · जीवन का आधार

A bilingual digital archive of **Shri Brajesh Gautam's** recorded teachings.
Ask anything in Hindi or English — the AI answers from his actual videos, with the embedded clip at the exact second and a verbatim quote.

> *"Thirty years of teachings. Ask anything — he has likely already answered."*

---

## What's in the archive

- **285 video teachings** ingested across Jyotish Vidya, Anchor of Life, When Ananda Speaks, and Sanatan series
- **610,155 transcript segments** with sub-second timestamps
- **69,838 semantic chunks** embedded (1,536-dim, OpenRouter / OpenAI text-embedding-3-small)
- **1,082 concept-graph nodes** built via [graphify](https://github.com/safishamsi/graphify), 918 edges, 58 substantive topic clusters
- **480 hours / 5.1 million words** of recorded teaching, all searchable in either language

## What it does well

**Hybrid retrieval — 12/12 eval pass.** Three rankers in parallel:

| Ranker | Signal | Why it matters |
|---|---|---|
| Lexical (SQLite FTS5) | BM25 over titles + segment text, with bilingual alias expansion | Mars-titled video wins for a Mars question |
| Concept-graph | Query → matched concept node → videos that primarily teach that concept | Authoritativeness — not just "any video that mentions it" |
| Semantic (sqlite-vec) | Embedding KNN, K=32 | Catches the questions where neither title nor concept matches |

Fused via Reciprocal Rank Fusion + a multiplicative title boost + a canonical-title bonus. See [`docs/ADR-001`](docs/ADR-001-hybrid-retrieval.md) for the full architecture decision.

**In-depth answers in BG's voice.** Each answer is a 4-section folio (~280–450 words):

1. Empathic opener (one sentence acknowledging the human situation)
2. Core teaching from the primary source
3. **BG across his teachings** — 2–3 angles drawn from different videos, each cited
4. What to do (only when sources contain a concrete practice)

Each answer surfaces:
- An **embedded YouTube clip** at the exact timestamp BG said the cited words
- The **verbatim quote** as a pull quote (drop cap, vermilion left rule)
- All 3–4 source videos, each clickable
- The lens (inner / jyotish / practice) that the answer engages
- "Brajesh ji has spoken about this in N teachings"

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router · TypeScript) | Server components query SQLite directly — no API hops |
| Styling | Tailwind v3 + custom design tokens | Editorial paper-and-ink palette. No gradients. |
| Typography | Fraunces · Tiro Devanagari Sanskrit · Mukta | Bilingual peer pairing, Devanagari treated as a first-class script |
| Database | SQLite + better-sqlite3 + sqlite-vec + FTS5 | One file. Trivial to back up. Vector + lexical in one. |
| Embeddings | `openai/text-embedding-3-small` via OpenRouter | Multilingual, 1,536 dim, $0.02/1M tokens |
| Composer LLM | `anthropic/claude-sonnet-4.5` via OpenRouter | One API key for embeddings + chat |
| Hosting | Fly.io (Mumbai) + Cloudflare R2 + Cloudflare DNS | $5/mo all-in. Zero egress on R2. |

## Project layout

```
anchor-of-life/
├── data/                       SQLite DB (gitignored). 540 MB once built.
├── docs/
│   └── ADR-001-…               Architecture decision record
├── scripts/
│   ├── 01-build-db.ts          schema
│   ├── 02-ingest-videos.ts     manifest.csv → videos
│   ├── 03-ingest-segments.ts   transcripts → segments + chunks
│   ├── 04-embed-segments.ts    chunks → 1,536-dim vectors via OpenRouter
│   ├── 05-ingest-graph.ts      graphify graph.json → concepts + 8 cards
│   ├── 06-build-fts.ts         FTS5 indexes
│   ├── eval.ts                 12-query regression set
│   ├── bootstrap.ts            production bootstrap (downloads DB from R2)
│   ├── upload-to-r2.ts         data:upload → R2
│   └── 99-stats.ts
├── src/
│   ├── app/                    7 routes + 6 API endpoints
│   │   └── api/ask/            POST: hybrid search → compose folio
│   ├── components/             Header, Hero, FolioAnswer, TranscriptDrawer, …
│   └── lib/
│       ├── search.ts           hybrid retrieval (RRF + 3 rankers)
│       ├── compose.ts          Claude folio composer
│       ├── aliases.ts          bilingual alias table + stop-words
│       ├── openrouter.ts       embed() + chat() with retries
│       ├── db.ts               sqlite-vec singleton
│       └── …
├── Dockerfile                  multi-stage build for Fly
├── fly.toml                    Mumbai region, persistent volume, auto-stop
└── README.md (this file)
```

## Running locally

```bash
# 1. install deps
npm install

# 2. add OpenRouter key to .env.local (see .env.example)
#    OPENROUTER_API_KEY=sk-or-…

# 3. build the database (one-time, ~25 minutes total)
npm run db:build       # schema
npm run db:videos      # 285 video metadata rows
npm run db:segments    # 610k segments + 70k chunks
npm run db:embed       # ~$0.10 in OpenRouter credits, ~15 min
npm run db:graph       # 1,082 concepts + 8 cards
npm run db:fts         # FTS5 indexes

# Or all at once:
npm run db:all

# 4. run the regression eval
npm run eval           # should print 12/12 PASS

# 5. dev server
npm run dev
# → http://localhost:3000
```

## Production deploy (Fly.io)

```bash
# 1. Cloudflare R2: create bucket, get API token (free tier covers this)
#    Add to .env.local:
#      R2_ACCOUNT_ID=, R2_BUCKET=anchoroflife,
#      R2_ACCESS_KEY_ID=, R2_SECRET_ACCESS_KEY=

# 2. Upload DB + transcripts to R2
npm run data:upload

# 3. Fly launch
fly launch  # uses fly.toml; pick Mumbai
fly volumes create anchor_data --size 2 --region bom
fly secrets set \
  OPENROUTER_API_KEY=sk-or-… \
  R2_ACCOUNT_ID=… \
  R2_BUCKET=anchoroflife \
  R2_ACCESS_KEY_ID=… \
  R2_SECRET_ACCESS_KEY=…

fly deploy
# Bootstrap downloads anchor.db from R2 on first boot.

# 4. Domain (Cloudflare Registrar): point CNAME → Fly. SSL automatic.
```

Total cost: ~$5/month (Fly $3 + R2 $0.01 + domain $0.85).

## Safety + privacy

- **Crisis detection** on every query — patterns for self-harm/suicide intent route to a hotline response (India: iCall, Vandrevala, AASRA, KIRAN) instead of running the AI.
- **No accounts. No tracking.** No Google Analytics. No 3rd-party cookies. Privacy-respecting analytics (Plausible/Umami) recommended for production.
- **Rate limit:** 30 requests / hour / IP on `/api/ask`. Prevents API key drain.
- **Answer cache:** 24h hash-keyed cache. Cuts LLM bill ~80% in steady state.
- **Honest "I don't know"** — composer is instructed to refuse to invent. If sources lack the answer, the response says so plainly.
- **No remedy fabrication** — if BG didn't state a remedy in a cited source, the answer points to a personal consultation rather than inventing one.

## Honest limits

- Whisper transcription has noise on dense Hindi/Hinglish — some quotes will read rough. A future pass with WhisperX-large or a learned correction dictionary would clean this.
- The 8 homepage life-situation cards were seeded from the curated 48-transcript graphify run, not the full 285. Run `/graphify --update` on the rest to expand.
- Personal-consultation paths (chart reading, specific remedies for a person) deliberately route to BG's real consultation. The AI doesn't pretend to do those.

## Credits

- **Teachings** © Shri Brajesh Gautam. Used for educational reference with full timestamped citations.
- **Trust:** [Spiritual Nectar of Wisdom (SNOW)](https://www.spiritualnectorofwisdom.org/) — non-profit, India + Canada.
- **Source channel:** [The Anchor of Life with Brajesh Gautam](https://www.youtube.com/@officialbrajeshgautam)

May this archive outlast all of us. That is the intention.
