# Kundli AI Agent — Transcript-Grounded Predictions

**Status:** Approved (brainstorming → writing-plans)
**Date:** 2026-05-05
**Owner:** Hemant Jadhav
**Repo:** [hemantsatishjadhav06-ai/anchor-of-life](https://github.com/hemantsatishjadhav06-ai/anchor-of-life)
**Live URL:** https://anchor-of-life.onrender.com/

## Goal

Replace the rule-based 20-field BG prescription on `/kundli/result` with a transcript-grounded AI agent that:

1. Computes the full set of charts a Brajesh Gautam-style reading needs (D-1, D-7, D-9, D-10, D-12, D-30) plus doshas, yogas, and Vimshottari dasha periods.
2. Generates per-area predictions ("readings") whose every claim is traceable to a Brajesh ji video transcript (no general LLM knowledge).
3. Lets the user chat about their chart afterward — same transcript-only knowledge base.
4. Presents everything in a tabbed, drill-down UI so nothing is dumped flat. Multiple chart visualizations and chart systems are switchable.

## Non-goals

- General-purpose astrology Q&A unrelated to a chart (the existing `/ask` page handles this).
- Reproducing transcript text verbatim. Readings paraphrase BG's points and cite the source video at the relevant timestamp.
- Full KP predictive engine in V1 (cuspal-sub-lord-based predictions). V1 ships KP cusps and sub-lord display only.

## User flow

1. User fills the existing `/kundli` form (name, date, time, place). No change here.
2. Submitting computes the full chart bundle (V1 scope below) on the server and lands on `/kundli/result`.
3. Result page opens on the **Overview** tab. The Overview reading auto-generates immediately.
4. User clicks any other tab (Marriage, Career, Children, Parents, Hardships, Doshas & Yogas, Dashas, Compare Systems). The reading for that tab generates lazily (~3–5 sec spinner the first time) and is cached afterward.
5. Below all tabs: a chat box. User types a question. The agent retrieves transcript chunks relevant to the question + chart context, generates a transcript-grounded reply with citations.
6. Every reading and chat reply renders citations as `[1] [2]` chips that link to the BG video at the exact timestamp (same UX as the existing `/ask` page).

## V1 Scope (this session — must ship + deploy)

### Charts computed

| Chart | What | Used in tab |
|---|---|---|
| D-1 (Rashi / Lagna) | Birth chart, sidereal Lahiri, whole-sign houses | Overview |
| D-9 (Navamsa) | 9th-harmonic | Marriage |
| D-10 (Dasamsa) | 10th-harmonic | Career |
| D-7 (Saptamsa) | 7th-harmonic | Children |
| D-12 (Dwadasamsa) | 12th-harmonic | Parents |
| D-30 (Trimsamsa) | 30th-harmonic | Hardships |
| Bhava Chalit | Sripati cusps; planets reassigned to true houses | Toggle on D-1 |

### Chart systems (toolbar dropdown — applies to D-1)

- **Sidereal / Lahiri** (default — current behavior)
- **Sayana** — same ephemeris, no ayanamsa subtraction → tropical positions
- **KP (Krishnamurti) — V1 lite** — Placidus cusps + 249-segment sub-lord table; cuspal sub-lord per house and planetary star/sub/sub-sub lords are displayed. KP-style predictions deferred to V2.

**System dropdown only changes what the chart visualization shows.** AI readings always source from the Sidereal/Lahiri D-1 chart facts because Brajesh ji's transcripts are taught in sidereal Vedic. When System = Sayana or KP, the chart panel updates but the reading panel stays grounded in sidereal facts — and the reading text itself flags this when relevant ("ब्रजेश जी सिडेरियल पद्धति में पढ़ाते हैं — यहाँ ट्रॉपिकल / KP केवल संदर्भ के लिए दिखाया गया है").

### Chart visualization styles (toolbar dropdown)

- **South Indian** (default — current behavior, 4×4 fixed-zodiac square)
- **Astro Wheel** — circular natal wheel SVG, ~360° with house cusps and planet glyphs at their actual longitude
- North Indian style is V2.

### Detections (computed once per chart)

- **Doshas:** Mangal, Kaal Sarp, Pitra, Sade Sati, debilitated-lord-mahadasha (when active)
- **Yogas:** Raj (kendra-trikona lord conjunctions), Dhana (2/5/9/11 lord interplay), Gajakesari (Jupiter–Moon kendra), Pancha-Mahapurusha (Hamsa, Bhadra, Shasha, Malavya, Ruchaka)
- **Dashas:** Vimshottari Mahadasha + Antardasha for the next 10 years from "today" (UTC), plus the active Maha+Antar at birth-time-now

### Tabs (life areas)

| Tab | Charts referenced | Reading focus |
|---|---|---|
| **Overview** | D-1 | Top-line: lagna, lagna lord, Moon sign, Atmakaraka, dominant yogas/doshas |
| **Marriage** | D-9 + D-1's 7th house | Venus, 7th lord, Navamsa lord, Mangal Dosh status |
| **Career** | D-10 + D-1's 10th house | Sun, Saturn, 10th lord, Dasamsa lord, current dasha for career timing |
| **Children** | D-7 + D-1's 5th house | Jupiter, 5th lord, Saptamsa positions |
| **Parents** | D-12 + D-1's 4th & 9th | Sun (father), Moon (mother), 4th/9th lords |
| **Hardships** | D-30 + D-1's 6/8/12 | Saturn, Rahu, malefics in dusthana, Sade Sati |
| **Doshas & Yogas** | (list view) | Each detected dosha and yoga gets a per-item AI explanation |
| **Dashas** | (timeline view) | Active Mahadasha + Antardasha; AI commentary on what BG says about this combination |
| **Compare Systems** | side-by-side | D-1 in Sidereal vs Sayana vs KP — summary of where they agree/differ |

### AI agent

**Per-tab reading agent** — `POST /api/kundli/reading`

- Input: `{chartHash, tabKey, language, chartContext}`
- For each tab, build a probe query from chart facts relevant to that tab. Example for Marriage: "Venus in {sign}, 7th lord {planet} in {house}, Navamsa lagna {sign}, {Mangal Dosh status}".
- Call existing `hybridSearch()` from `lib/search.ts` to retrieve top-K (K=6) BG transcript chunks for the probe.
- Call `chat()` from `lib/openrouter.ts` with a system prompt that pins the AI to BG's voice and forbids non-transcript claims (template in `src/lib/agent/prompts.ts`).
- Return a `FolioEnvelope` (same shape `/api/ask` already returns) so the existing citation rendering works unchanged.

**Chart-aware chat agent** — `POST /api/kundli/chat`

- Input: `{chartHash, chartContext, history, userMessage, language}`
- Retrieve transcripts based on the user's message + chart context.
- Same system-prompt template (chat variant) — chart facts always available, transcript-only knowledge.
- Returns the same FolioEnvelope shape, plus the assistant message gets appended to the conversation history client-side.

**Crisis handling** — same `CRISIS_PATTERNS` from `/api/ask` apply to the chat endpoint. Reading endpoint never sees free-text user input so doesn't need it.

### Caching

- **Chart hash** = stable hash of `{date, time, lat, lon, tzOffsetMinutes, system}`.
- **Reading cache** keyed by `(chartHash, tabKey, lang)`. Server-side in-memory `Record<string,...>`, 24h TTL — same pattern as `/api/ask`.
- **Client cache** in `sessionStorage` so tab switches within a session never re-call.
- **Chat cache** is opt-in per question (same as `/api/ask`).

### File layout

```
src/lib/astrology/
  compute.ts          (extended: D-7, D-10, D-12, D-30, Sayana mode, Bhava Chalit, divisionalChart helper)
  kp.ts               (new: Placidus cusps, sub-lord table, cuspal sub-lord lookup)
  doshas.ts           (new: Mangal, Kaal Sarp, Pitra, Sade Sati)
  yogas.ts            (new: Raj, Dhana, Gajakesari, Pancha-Mahapurusha)
  dasha.ts            (new: Vimshottari Maha + Antardasha)
  prescription.ts     (DELETED — replaced by AI readings)
  types.ts            (extended: ChartSystem, ChartStyle, FullChartV2, Dasha types)

src/lib/agent/
  reading.ts          (new: per-tab probe builder + reading orchestrator)
  prompts.ts          (new: system prompt templates per tab + chat variant)
  chartContext.ts     (new: serialize chart facts into LLM-readable text)

src/components/kundli/
  KundliResultPage.tsx     (new — was inline in app/kundli/result/page.tsx)
  TabBar.tsx               (new)
  ChartToolbar.tsx         (new — Style + System dropdowns)
  AstroWheel.tsx           (new — circular SVG)
  KundliChart.tsx          (existing — South Indian; kept and possibly tweaked)
  Reading.tsx              (new — renders FolioEnvelope, citations)
  ChartChat.tsx            (new — multi-turn chat box)
  DoshaList.tsx            (new)
  YogaList.tsx             (new)
  DashaTimeline.tsx        (new)
  CompareSystems.tsx       (new — Sidereal vs Sayana vs KP side-by-side)

src/app/api/kundli/
  route.ts            (existing — extended to compute the full chart bundle including new charts/doshas/yogas/dashas)
  reading/route.ts    (new — per-tab AI reading endpoint)
  chat/route.ts       (new — chart-aware chat endpoint)

src/app/kundli/result/page.tsx  (rewritten to use new tab UI from src/components/kundli/)
```

The existing `KundliForm.tsx` and `lib/openrouter.ts` are untouched (they already do exactly what we need).

### Testing

Test runner: Vitest. Add to `package.json` devDependencies; use `tests/` directory at repo root.

**Unit tests:**

- `tests/astrology/compute.test.ts` — D-1 + D-9 lock-in: known birth (e.g., Mahatma Gandhi 1869-10-02 07:11 Porbandar) → published planet positions ±0.5°.
- `tests/astrology/divisional.test.ts` — D-7/D-10/D-12/D-30: pick 2 published charts each, verify sign of each planet in the divisional chart.
- `tests/astrology/dasha.test.ts` — Vimshottari from a known Moon-nakshatra → verified Maha lord at birth + 10-year lord sequence.
- `tests/astrology/doshas.test.ts` — synthetic charts that should and should not trigger each dosha.
- `tests/astrology/yogas.test.ts` — same pattern for yogas.
- `tests/astrology/kp.test.ts` — at minimum: sub-lord table sum = 360°, sub-lord of a known cusp matches a published KP source.

**Integration test:**

- `tests/api/reading.test.ts` — POSTs to `/api/kundli/reading`, mocks `hybridSearch` to return canned transcript chunks, asserts the returned envelope has citations and `answer_md` is non-empty.

**Transcript verification script** (the user-visible "verify with transcript" loop):

- `scripts/verify-readings.ts` — runs the reading agent on 5 fixed charts × 8 tabs = 40 readings. For each generated claim sentence, checks that at least one cited transcript chunk substantively contains the concept (lemma overlap ≥ 50%, or LLM-judge with a stricter check). Prints a pass/fail report. If fail rate > 20%, the prompt gets tightened.

**Post-deploy smoke test:**

- `scripts/smoke-deploy.ts` — hits the live URL with a fixed sample birth, asserts the result page renders, all 9 tabs load, each reading is non-empty, each citation URL is valid (HEAD 200).

### Performance & cost

- ~8 LLM calls per fully-explored kundli (Overview eager + 7 tab clicks lazy + ~1 chat turn). Claude Sonnet 4.5 at ~1.5K tokens each ≈ $0.02 per kundli on first generation. Cache makes repeats free.
- Chart math is sub-50ms on the server (pure JS, no I/O).
- Result page time-to-first-paint should match the existing page (chart math runs server-side, Overview reading streams in).

### Migration

- Existing visitors with bookmarked `/kundli/result` URLs continue to work — the form already round-trips through `sessionStorage` and the new code reads the same input shape.
- The `prescription` field that the existing API returns is removed. No external callers exist (this is purely an internal client → API contract).

## V2 Scope (next session, after V1 is live and verified)

- Full KP predictive agent: cuspal-sub-lord-based predictions, KP rule engine, dasha analysis using KP sub-lords.
- North Indian chart style (3rd visualization choice).
- Bhava Chalit toggle promoted from "advanced" to default for D-1.
- Deeper Compare-Systems analysis (RP / ruling planets, KP-vs-Vedic transit comparison).

## Risks and open questions (to resolve during implementation, not now)

- **Transcript coverage gaps.** If no BG video covers, e.g., D-30 in detail, the Hardships reading may be thin. Mitigation: the prompt instructs the AI to admit gaps explicitly rather than fabricate. The verification script catches fabrication.
- **KP sub-lord precision.** Standard KP uses Placidus cusps + Vimshottari sub-divisions; getting the boundary computation exactly right requires care. Mitigation: cross-check against a published KP table for a known birth in `tests/astrology/kp.test.ts`.
- **Sayana use-case.** Most BG content is sidereal. The Sayana tab is included for completeness but readings on it will repeatedly note "Brajesh ji teaches in the sidereal system; tropical positions are shown for reference only." This is expected, not a bug.
- **Render free-tier cold starts.** First request after idle takes ~30s. Acceptable for V1; revisit if it bites.

## Acceptance criteria (V1)

1. `/kundli/result` shows tabs as specified. All tabs render their chart + reading + citations.
2. Toolbar Style dropdown switches D-1 between South Indian and Astro Wheel.
3. Toolbar System dropdown switches D-1 between Sidereal, Sayana, and KP (KP shows cusps + sub-lords).
4. Chat box accepts free-text and replies grounded only in transcripts; replies show citations.
5. All unit tests pass.
6. `scripts/verify-readings.ts` reports < 20% fabrication rate across 40 readings.
7. Site deploys to https://anchor-of-life.onrender.com and smoke test passes.
8. Direct link returned to user.
