# ADR-001: Hybrid Retrieval, In-Depth Answer Composition, and Remote Data Hosting

**Status:** Accepted (implemented · 12/12 eval pass)
**Date:** 2026-05-02
**Deciders:** Hemant (project owner), Brajesh ji (content owner)

---

## Context

The `anchor-of-life` site is a public archive of Brajesh Gautam's recorded teachings (285 videos · 610k transcript segments · 70k embedded chunks · 1,082 concept-graph nodes). Goal: legacy preservation — anyone, anywhere, can ask anything and get a grounded, sourced answer drawn from BG's actual teachings.

Three blocking issues in the original build:

1. **Retrieval quality** — single-channel vector search returned wrong canonical videos. *Mangal query → Pluto episode as primary citation.* The Mars episode IS embedded; it just doesn't win on cosine alone, because:
   - Cross-script embedding penalty: query "mangal" (Latin) vs corpus "मंगल" (Devanagari)
   - Discursive-vs-definitional asymmetry in chunk phrasing
   - No title or graph signal in the ranking
2. **Answer depth** — composer was brief and reserved. We want in-depth synthesis: "where and what BG has said across his videos," reading like a curator presenting an artist's body of work, not a one-shot snippet.
3. **Data hosting for live deployment** — 540 MB SQLite + 285 transcript JSONs cannot live in git. Need a structured, durable home that the production app can pull from at boot, that survives provider failure.

## Decision

Three coupled changes, shipped together:

### A. Hybrid retrieval with Reciprocal Rank Fusion

Replace single-channel vector KNN with three parallel rankers fused via RRF, with a multiplicative title boost and a fixed canonical-title bonus.

```
question → tokenize → drop stopwords → expand bilingual aliases
   │
   ├─► Ranker A: LEXICAL (FTS5 on title_fts + segment_fts, BM25)
   │     • title hits get higher rank weight (1 hit = top-K)
   │     • segment hits via BM25 over chunk text
   │
   ├─► Ranker B: CONCEPT-GRAPH ROUTING
   │     • alias-table direct match on canonical concepts
   │     • join concept_videos to find videos primarily about those concepts
   │
   └─► Ranker C: VECTOR KNN (sqlite-vec, K=32, group by video)
   
   ▼ score(v) = Σ 1/(60 + rank_i(v))
   ▼ × 2.5 if title_match(v)
   ▼ + 0.04 if canonical_title_match(v)   (length≥3 alias form in title)
```

Bilingual normalization: ~80-entry hand-curated alias table (`mangal ↔ मंगल ↔ Mars`, `karma ↔ कर्म`, `shani ↔ शनि ↔ Saturn`, etc.) with stop-word filtering for both English and Hindi function words.

### B. In-depth answer composition

Composer produces a 4-section folio (~280–450 words):

1. **Empathic opener** — 1 sentence acknowledging the human situation
2. **Core teaching** — BG's primary view, 3–5 sentences, primary citation
3. **BG across his teachings** — synthesis across 2–3 angles, each citing a different source
4. **What to do** — only if cited sources contain a concrete practice

Voice rule: *write about Brajesh ji's teaching, never as him.* Use his exact phrasing in pull quotes; use connective prose for the framing.

Primary-citation rule: respect the retrieval ranking. Source 1 is intended to be the canonical video; the composer overrides only if Source 1 is genuinely off-topic.

### C. Remote data hosting

| Artifact | Where | Why |
|---|---|---|
| Code | GitHub (private → public when stable) | Trust signal, legacy, contributable |
| `anchor.db` (~540 MB) | Cloudflare R2 (private bucket) | Single file, fast cold-boot download, zero egress fees |
| Raw transcripts archive | Cloudflare R2 | Reproducibility — anyone can rebuild the DB |
| `graph.json` (~870 KB) | Committed to repo | Small, central to the build |

Bootstrap on Fly.io: if `/data/anchor.db` missing on container start, download from R2; otherwise use it. Daily cron uploads a date-stamped backup to R2; retain 30 days.

## Options Considered

### Option A: Pure vector + LLM reranker (rejected)
Add a Claude-based reranker after KNN. **Rejected:** doesn't fix the recall problem (reranker chooses among already-wrong candidates) and adds per-query LLM cost.

### Option B: Hybrid retrieval with RRF (chosen)
Multi-channel ranking + alias-aware FTS5 + concept-graph routing.
**Chosen:** addresses root cause; deterministic; fast (sub-100 ms); free; in-process.

### Option C: Migrate to dedicated vector DB (rejected for now)
Qdrant or Weaviate.
**Rejected:** premature for 70k chunks. Adds infra surface. Revisit if corpus exceeds ~500k chunks.

### Option D: GitHub-only data hosting (rejected)
Git LFS or Release assets.
**Rejected:** LFS bandwidth quotas would bite if site gets traction; Release assets awkward for nightly backups.

## Trade-off Analysis

The big trade-off is **simplicity now vs. abstraction headroom later**. Hybrid-RRF in SQLite is more code than pure-vector but stays one process, one DB file, zero external dependencies. The alias table is small and human-auditable. The graph layer was already built — using it as a ranker is essentially free.

Cloudflare R2 vs S3: R2 wins on egress fees (zero) — important because Fly will pull `anchor.db` on every cold boot.

## Consequences

### What becomes easier
- Retrieval correctness on keyword-heavy questions (planet/concept queries)
- Adding new ranking signals later (recency, popularity) — RRF accepts arbitrary rankers
- Disaster recovery — DB on R2, transcripts on R2, code on GitHub
- Reproducibility — anyone can clone repo, pull data from R2, rebuild

### What becomes harder
- One more index to keep in sync (FTS5 — must rebuild on transcript ingestion)
- Alias table needs occasional maintenance (low: ~80 entries, append-only)

### What we'll need to revisit
- If corpus grows past ~5,000 videos, in-process FTS5 may slow → revisit dedicated VDB
- If multilingual support expands beyond Hindi+English (Tamil, Marathi, Bengali), the alias-table approach won't scale → consider an LLM-based query expansion step

## Regression Eval Set

`scripts/eval.ts` runs 12 known query→canonical-video pairs on every change. CI gate: ≥10/12 must pass. **Current: 12/12 at rank 1.**

| Query | Expected canonical |
|---|---|
| how will mangal effect me | Planet Mars (Ep. 13) |
| मंगल का असर क्या है | Planet Mars (Ep. 13) |
| Saturn in 7th house | Planet Saturn (Ep. 12) |
| सप्तम भाव में शनि | Planet Saturn (Ep. 12) |
| pitr dosh remedies | Chitragupta / Ketu / Pitrr Lok |
| jupiter remedies | Planet Jupiter (Ep. 32) |
| how to deal with anger | Anger (BG video) |
| क्रोध को कैसे संभालें | Anger (BG video) |
| feeling alone | Tinku / loneliness |
| sade sati | Saturn (Ep. 12) |
| what is munna | Munna / Tinku |
| how to manifest | PUMP / Manifest |

## Action Items

1. ✅ Build FTS5 virtual tables over titles + segments
2. ✅ Implement bilingual alias normalization with stop-word filtering
3. ✅ Implement concept-graph ranker
4. ✅ RRF fusion + multiplicative title boost + canonical bonus
5. ✅ Rewrite composer prompt for 4-section in-depth answers
6. ✅ Add eval harness — passing 12/12
7. ✅ Crisis classifier on `/api/ask`
8. ✅ Rate limit + 24h answer cache
9. ✅ Dockerfile + fly.toml + bootstrap script
10. ☐ Create R2 bucket; upload `anchor.db` + transcripts archive
11. ☐ `fly launch` first deploy
12. ☐ Domain + Cloudflare DNS + SSL
13. ☐ **Rotate the OpenRouter key** (the original one was shared in chat)
