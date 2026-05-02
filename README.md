# Anchor of Life · ब्रजेश गौतम

A digital archive of Shri Brajesh Gautam ji's recorded teachings — every video transcribed, every concept indexed, every answer cited back to the exact second on YouTube. Bilingual (Hindi & English). Editorial design, not chatbot chrome.

> *"Thirty years of teachings. Ask anything — he has likely already answered."*

## What's in here

- **The Library** — 280 video teachings, 610,000 segment-level transcripts, 70,000 semantic chunks.
- **Ask Brajesh ji** — semantic search over the corpus → Claude composes a folio-style answer with the **embedded YouTube clip at the exact timestamp**, the **verbatim quote**, and links to the source.
- **Knowledge graph** — 1,082 concept nodes / 918 edges / 58 substantive topic clusters (built via [graphify](https://github.com/safishamsi/graphify), a separate run on the curated 48 transcripts).
- **8 life-situation cards** on the homepage — auto-derived from the graph's communities.
- **Fully searchable transcript drawer** on every video page, click any line to seek the player.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router, TS) | Server components mean the homepage queries SQLite directly — no API hops. |
| Styling | Tailwind v3 + custom design tokens | Editorial palette (paper / ink / one vermilion accent). No gradients. |
| Typography | Fraunces (Latin display) · Tiro Devanagari Sanskrit · Mukta | Bilingual peer pairing. Devanagari treated as a first-class script, not a translation. |
| Database | SQLite + better-sqlite3 + sqlite-vec | One file. Trivial to back up. Vector search built in. |
| Embeddings | `openai/text-embedding-3-small` via OpenRouter | Multilingual; 1,536 dim. |
| LLM | `anthropic/claude-sonnet-4.5` via OpenRouter | Composes the folio answer. One key for both. |

One API key (OpenRouter) for everything. No separate OpenAI/Anthropic accounts needed.

## Project layout

```
anchor-of-life/
├── data/                       # SQLite database (gitignored). Single file.
├── scripts/
│   ├── 01-build-db.ts          # CREATE TABLE…
│   ├── 02-ingest-videos.ts     # manifest.csv → videos
│   ├── 03-ingest-segments.ts   # transcripts_json/*.json → segments + chunks
│   ├── 04-embed-segments.ts    # OpenRouter → 1,536-dim embeddings
│   ├── 05-ingest-graph.ts      # graphify graph.json → concepts + communities
│   └── 99-stats.ts             # quick health check
├── src/
│   ├── app/                    # Next App Router routes & pages
│   │   ├── page.tsx            # Homepage (hero + daily anchor + 8 cards + library teaser)
│   │   ├── ask/page.tsx        # /ask?q=… (folio answer view)
│   │   ├── library/            # /library and /library/[id] (video page with transcript drawer)
│   │   ├── topic/[slug]/       # /topic/relationships, /topic/karma-fate-…
│   │   ├── about/              # About Brajesh ji + SNOW + disclaimers
│   │   └── api/
│   │       ├── ask/            # POST: question → embed → search → compose → JSON envelope
│   │       ├── library/        # GET: paginated list
│   │       ├── topic/[slug]/   # GET: concepts + videos for a community
│   │       ├── video/[id]/     # GET: full transcript + concepts
│   │       ├── daily/          # GET: today's anchor clip
│   │       └── cards/          # GET: 8 life-situation cards
│   ├── components/             # Header, Footer, SearchBox, FolioAnswer, etc.
│   └── lib/
│       ├── db.ts               # sqlite-vec singleton
│       ├── openrouter.ts       # embed() + chat() with retries
│       ├── search.ts           # vector search → group → cite
│       ├── compose.ts          # Claude folio composer (system prompt is the heart)
│       ├── i18n.ts             # bilingual strings
│       ├── youtube.ts          # timestamp/embed URL helpers
│       └── vec.ts              # Float32 BLOB ↔ number[] codec
└── README.md (this file)
```

## Run it locally

```bash
# 1. install
npm install

# 2. add your OpenRouter key to .env.local (already present here)
#    OPENROUTER_API_KEY=sk-or-…

# 3. build the database (one-time, ~20 minutes for embeddings)
npm run db:build       # schema
npm run db:videos      # 285 video metadata rows from manifest.csv
npm run db:segments    # 610k segments + 70k chunks
npm run db:embed       # ← the slow one. ~$0.10 in OpenRouter credits.
npm run db:graph       # graphify graph.json → 1k concepts + 8 cards

# 4. dev server
npm run dev
# → http://localhost:3000

# Health check at any time
npm run db:stats
```

The embedding step is resumable — `chunks.embedded` is tracked per row, so killing and restarting `npm run db:embed` picks up where it left off.

## How "Ask Brajesh ji" works

1. **You type a question** (Hindi or English — the system auto-detects).
2. **Embed the question** with `text-embedding-3-small`.
3. **Vector search** the chunks table → top 16 matches.
4. **Group by video** → pick best chunk per video → top 4 unique videos.
5. **Pull verbatim quotes** from the original Whisper segments around each match (so the citation is BG's actual words, not a chunk-window approximation).
6. **Detect related topic clusters** by joining hits → concept_videos → topics.
7. **Claude composes** a folio answer in the user's language, citing sources by `{{cite:N}}` markers, disclosing the lens (inner / jyotish / practice).
8. **Render the folio**: question · answer with footnote markers · embedded YouTube clip starting at the exact second · the verbatim quote pull · related sources · related topics.

If the corpus doesn't contain enough to answer, the system says so plainly. It never invents.

## Design system

**Editorial. Not chatbot.**

- Paper-and-ink palette. `#F8F4EC` parchment, `#1F1B16` warm ink, **one** vermilion `#B83227` accent reserved for sacred/citation markers.
- Three-font system: Latin display (Fraunces), Devanagari serif (Tiro Devanagari Sanskrit), UI sans (Mukta — handles both scripts for labels).
- Drop caps on first paragraph of folio answers. Pull quotes with vermilion left rule. No iMessage chat bubbles. No "AI typing" indicators.
- Generous whitespace. Slow editorial transitions (`cubic-bezier(0.22, 0.61, 0.36, 1)`).
- Devanagari numerals available via setting (planned). Hindi and English given equal weight on every page.

Reference points: Rekhta, Hindwi, NYT Magazine, Met Museum collection. Anti-references: pi.ai, Co-Star, any "spiritual AI" app on the App Store.

## Deploy

The database is ~600MB once fully embedded — too large for Vercel functions. Recommended targets:

**Fly.io** (best fit — single small VM with persistent volume)
```bash
fly launch
fly volumes create anchor_data --size 2 --region bom
# mount /data, set DB_PATH=/data/anchor.db
# upload the prebuilt anchor.db once with: fly ssh sftp shell
fly deploy
```

**Render** — also works. Persistent disk, Node web service.

**Cloudflare Pages + D1** — possible but requires migrating from SQLite-with-vec to D1 + a vector store like Vectorize.

The `data/anchor.db` file is the entire datastore. Back it up with `cp`. Restore by replacing the file. That's the deployment promise.

## Honest limits

- Whisper makes mistakes on Hindi/Hinglish. Some quotes contain transcription noise. There's no easy fix without re-transcribing with better models.
- Answers are drawn from BG's *recorded* teachings only. They don't account for what he might say to *you specifically* — for that, book a real consultation.
- Auto-generated remedy claims are gated on having a real source citation. The composer is instructed to refuse to invent remedies. If sources don't contain a remedy, the answer says so.
- The graph was run on the curated 48 transcripts (Anchor of Life + Jyotish Vidya), not the full 285. The remaining transcripts are still in the search index — but only the 48 contributed concept tags. Run `/graphify --update` on the rest to expand the graph layer when needed.

## Credits

- **Teachings:** © Shri Brajesh Gautam. Used here for educational reference with full timestamped citations.
- **Trust:** [Spiritual Nectar of Wisdom (SNOW)](https://www.spiritualnectorofwisdom.org/), India + Canada.
- **Source channel:** [The Anchor of Life with Brajesh Gautam](https://www.youtube.com/@officialbrajeshgautam) on YouTube.

May this archive outlast all of us. That is the intention.
