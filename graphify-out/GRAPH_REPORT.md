# Graph Report - /Users/hemantjadhav/untitled folder/anchor-of-life  (2026-05-06)

## Corpus Check
- 116 files · ~212,903 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 362 nodes · 489 edges · 27 communities detected
- Extraction: 90% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Astrology Computation|Astrology Computation]]
- [[_COMMUNITY_Data Ingestion Pipeline|Data Ingestion Pipeline]]
- [[_COMMUNITY_Homepage UI|Homepage UI]]
- [[_COMMUNITY_Architecture Docs|Architecture Docs]]
- [[_COMMUNITY_LLM Agent Layer|LLM Agent Layer]]
- [[_COMMUNITY_Astrology Computation (birthToUtc())|Astrology Computation (birthToUtc())]]
- [[_COMMUNITY_Architecture Docs (Limit Alias-table approa)|Architecture Docs (Limit: Alias-table approa)]]
- [[_COMMUNITY_Astrology Computation (AllCharts (D1D9D10D7D)|Astrology Computation (AllCharts (D1/D9/D10/D7/D)]]
- [[_COMMUNITY_Astrology Computation (KundliForm)|Astrology Computation (KundliForm)]]
- [[_COMMUNITY_LLM Agent Layer (POST apikundlichat (mu)|LLM Agent Layer (POST /api/kundli/chat (mu)]]
- [[_COMMUNITY_Architecture Docs (Problem Composer was bri)|Architecture Docs (Problem: Composer was bri)]]
- [[_COMMUNITY_Search and Composition|Search and Composition]]
- [[_COMMUNITY_Astrology Computation (astrologytypes.ts)|Astrology Computation (astrology/types.ts)]]
- [[_COMMUNITY_Search and Composition (libcompose.ts folio orch)|Search and Composition (lib/compose.ts folio orch)]]
- [[_COMMUNITY_Homepage UI (About Page (Brajesh Gauta)|Homepage UI (About Page (Brajesh Gauta)]]
- [[_COMMUNITY_Library and Topic Pages|Library and Topic Pages]]
- [[_COMMUNITY_Search and Composition (composeFolio())|Search and Composition (composeFolio())]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Build Config|Build Config]]
- [[_COMMUNITY_Page Routes|Page Routes]]
- [[_COMMUNITY_Core API Routes|Core API Routes]]
- [[_COMMUNITY_Search and Composition (buildCitationsFromVideos()|Search and Composition (buildCitationsFromVideos()]]
- [[_COMMUNITY_Library and Topic Pages (relatedTopicsForVideos())|Library and Topic Pages (relatedTopicsForVideos())]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_LLM Agent Layer (prescriptionTypes.ts (BGP)|LLM Agent Layer (prescriptionTypes.ts (BGP)]]
- [[_COMMUNITY_Astrology Computation (Chart  FullChart  Birth)|Astrology Computation (Chart / FullChart / Birth)]]
- [[_COMMUNITY_Library and Topic Pages (Whisper Transcription Hin)|Library and Topic Pages (Whisper Transcription Hin)]]

## God Nodes (most connected - your core abstractions)
1. `Kundli AI Agent Implementation Plan` - 34 edges
2. `Anchor of Life Project` - 20 edges
3. `TopicPage (/topic/[slug])` - 13 edges
4. `Step 01: Build SQLite Schema (videos/segments/chunks/concepts/topics/cards/vec0)` - 12 edges
5. `KundliResultPage (/kundli/result)` - 12 edges
6. `lib/db (better-sqlite3 + sqlite-vec connection)` - 12 edges
7. `Env Loader (dotenv .env.local)` - 11 edges
8. `HomePage (/)` - 10 edges
9. `VideoPage (/library/[id])` - 10 edges
10. `POST /api/ask (RAG hybrid search + crisis path + cache + rate limit)` - 10 edges

## Surprising Connections (you probably didn't know these)
- `KundliForm` --semantically_similar_to--> `KundliChart (SVG North-Indian)`  [AMBIGUOUS] [semantically similar]
  src/components/KundliForm.tsx → src/components/KundliChart.tsx
- `FolioEnvelope / AnswerEnvelope Shape` --semantically_similar_to--> `4-Section Folio Answer Format`  [INFERRED] [semantically similar]
  docs/superpowers/plans/2026-05-05-kundli-ai-agent.md → README.md
- `Chart-Hash Cache (24h TTL)` --semantically_similar_to--> `24h Hash-Keyed Answer Cache`  [INFERRED] [semantically similar]
  docs/superpowers/plans/2026-05-05-kundli-ai-agent.md → README.md
- `Next.js Config (Strict Mode + Image Hosts + sqlite externals)` --conceptually_related_to--> `lib/db (better-sqlite3 + sqlite-vec connection)`  [INFERRED]
  next.config.js → src/lib/db.ts
- `tailwind.config.ts editorial palette` --conceptually_related_to--> `lib/i18n.ts STR table en/hi`  [INFERRED]
  tailwind.config.ts → src/lib/i18n.ts

## Hyperedges (group relationships)
- **SQLite Schema Definition (10 tables for full-stack RAG)** — concept_videos_table, concept_segments_table, concept_chunks_table, concept_chunk_vec_table, concept_concepts_table, concept_concept_edges_table, concept_concept_videos_table, concept_topics_table, concept_featured_cards_table, concept_title_fts_table, concept_segment_fts_table [EXTRACTED 1.00]
- **Kundli end-to-end flow (form -> compute -> result -> readings/prescription)** — comp_kundliform, kundli_route, session_storage_kundli, kundli_result_page, ext_kundli_allcharts, ext_kundli_prescriptiontable, ext_kundli_reading, ext_kundli_lifeareasection, kundli_reading_route, kundli_prescription_route, ext_compute_full_chart, ext_generate_reading, ext_generate_prescription [EXTRACTED 0.95]
- **Library / video browsing (library list -> video detail -> video API)** — library_page, library_video_page, library_route, video_id_route, ext_videotile, ext_transcriptdrawer, db_table_videos, db_table_segments, db_table_concepts [EXTRACTED 0.90]
- **Topic / featured-card browsing flow (home -> topic page -> SQLite tables)** — page_home, comp_lifesituationcards, topic_slug_page, topic_slug_route, db_table_featured_cards, db_table_topics, db_table_concepts, db_table_concept_videos, db_table_videos [EXTRACTED 0.90]
- **RAG Question-Answering Flow** — api_ask_route, lib_search_module, lib_compose_module, lib_aliases_module, lib_vec_module, concept_chunk_vec_table, concept_segment_fts_table, concept_title_fts_table [EXTRACTED 0.95]
- **Kundli UI Tab System** — tabbar_component, lifeareasection_component, reading_component, chartcontext_tabkey, chartcontext_chartcontextfor, chartcontext_probequeryfor, reading_generatereading, ext_api_reading [INFERRED 0.90]
- **Hybrid Retrieval + Folio Composition** — search_hybridsearch, search_rankerlexical, search_rankerconcept, search_rankersemantic, search_fuse, search_buildcitations, compose_composefolio, openrouter_chat, openrouter_embed, db_getdb [EXTRACTED 0.95]
- **Prescription Pipeline (UI to LLM)** — prescriptiontable_component, fieldexplainer_component, prescriptiontypes_bgprescription, prescriptiontypes_fields, prescription_generateprescription, fieldexplain_generatefieldexplanation, prescription_systemprompt, ext_api_prescription, ext_api_fieldexplain [INFERRED 0.90]
- **Transcript-Grounded LLM Agents (RAG pattern)** — chat_generatechatreply, reading_generatereading, fieldexplain_generatefieldexplanation, prescription_generateprescription, ext_search_hybridsearch, ext_search_buildcitations, ext_openrouter_chat, chartcontext_chartcontextfor, prompts_reading, prompts_chat [INFERRED 0.92]
- **Astrology Computation Pipeline** — compute_computefullchart, compute_computed1, compute_computedivisional, divisional_signof, dasha_computevimshottari, doshas_detectalldoshas, yogas_detectallyogas, kp_computekp, ext_bhavachalit, astrotypes_chart [EXTRACTED 1.00]
- **Hybrid Retrieval Fused via RRF** — readme_lexical_ranker_fts5, readme_concept_graph_ranker, readme_semantic_ranker_sqlite_vec, readme_reciprocal_rank_fusion [EXTRACTED 1.00]
- **Four-Section Folio Answer** — readme_empathic_opener, readme_core_teaching_section, readme_bg_across_teachings_section, readme_what_to_do_section [EXTRACTED 1.00]
- **Full Kundli Chart Bundle (D-1/7/9/10/12/30 + Dasha + Doshas + Yogas + KP)** — plan_chart_d1_lagna, plan_chart_d7_saptamsa, plan_chart_d9_navamsa, plan_chart_d10_dasamsa, plan_chart_d12_dwadasamsa, plan_chart_d30_trimsamsa, plan_vimshottari_dasha, plan_system_kp_lite [EXTRACTED 1.00]

## Communities

### Community 0 - "Astrology Computation"
Cohesion: 0.04
Nodes (54): astronomy-engine Library, Bhava Chalit (Sripati cusps), BPHS Divisional Chart Rules, D-10 Dasamsa Chart, D-12 Dwadasamsa Chart, D-1 Rashi/Lagna Chart, D-30 Trimsamsa Chart, D-7 Saptamsa Chart (+46 more)

### Community 1 - "Data Ingestion Pipeline"
Cohesion: 0.11
Nodes (36): Step 01: Build SQLite Schema (videos/segments/chunks/concepts/topics/cards/vec0), Step 02: Ingest Videos from CSV Manifest, Step 03: Ingest Segments and Build 30s Chunks (overlap=6s), Step 04: Embed Chunks via OpenRouter (batch=96, parallel=3, retries=8), Step 05: Ingest graphify Knowledge Graph (concepts/topics/edges/featured cards), Step 06: Build FTS5 Index (titles + chunks, bilingual), Step 99: DB Stats Dashboard, Env Loader (dotenv .env.local) (+28 more)

### Community 2 - "Homepage UI"
Cohesion: 0.14
Nodes (34): AskPage (/ask), DailyAnchor, FolioAnswer, Footer, Header, Hero, LangToggle, LifeSituationCards (+26 more)

### Community 3 - "Architecture Docs"
Cohesion: 0.06
Nodes (34): Bootstrap: download anchor.db from R2 if missing, Problem: 540MB SQLite cannot live in git, Rationale: R2 wins on zero egress fees, POST /api/kundli/reading Endpoint, Chart Context Serializer (LLM-readable), Chart-Hash Cache (24h TTL), Per-Tab Probe Query Builder, READING_SYSTEM_PROMPT (3-paragraph folio) (+26 more)

### Community 4 - "LLM Agent Layer"
Cohesion: 0.11
Nodes (31): buildFtsQuery() (FTS5 OR-clause builder), expandAliases() (n-gram alias expansion), aliases.ts (bilingual alias table + tokenizer), tokenize() (Devanagari/Latin + stopword filter), chartContextFor(tab,fc), chartContext.ts (chart->LLM serializer + tab probes), probeQueryFor(tab,fc), generateChatReply() (+23 more)

### Community 5 - "Astrology Computation (birthToUtc())"
Cohesion: 0.09
Nodes (19): computeD1(), computeDivisional(), computeFullChart() orchestrator, getAyanamsa() Lahiri, getEclipticLongitude(), computeVimshottari(), MAHA_LORDS / MAHA_YEARS, divisionalSignOf() D-1/7/9/10/12/30 (+11 more)

### Community 6 - "Architecture Docs (Limit: Alias-table approa)"
Cohesion: 0.09
Nodes (23): Limit: Alias-table approach won't scale beyond Hindi+English, Revisit Threshold: 5000+ videos -> dedicated VDB, Cause: Cross-script embedding penalty (Latin vs Devanagari), ADR-001 Hybrid Retrieval Decision, Cause: Discursive vs Definitional Phrasing Asymmetry, Failure Case: Mangal query returned Pluto episode, Cause: No title or graph signal in ranking, Option A (rejected): Pure vector + LLM reranker (+15 more)

### Community 7 - "Astrology Computation (AllCharts (D1/D9/D10/D7/D)"
Cohesion: 0.12
Nodes (19): AllCharts (D1/D9/D10/D7/D12/D30 grid), computeBhavaChalit() function, bhavaChalit.ts (Sripati cusp recompute), ChartChat (multi-turn chat UI), TabKey union type (overview..compare), ChartToolbar (style/system/bhavaChalit), KundliChart (SVG North-Indian), CompareSystems (sidereal/sayana/KP) (+11 more)

### Community 8 - "Astrology Computation (KundliForm)"
Cohesion: 0.14
Nodes (18): KundliForm, computeFullChart (lib), generatePrescription (agent), generateReading (agent), GET /api/geocode, AllCharts (kundli), ChartChat, DashaTimeline (+10 more)

### Community 9 - "LLM Agent Layer (POST /api/kundli/chat (mu)"
Cohesion: 0.17
Nodes (15): POST /api/kundli/chat (multi-turn chart-aware chat), POST /api/kundli/field-explain (explain one prescription field), Bootstrap: Download anchor.db from R2/GitHub/HTTP at Container Start, lib/agent/chartContext (TabKey), lib/agent/chat (generateChatReply, ChatTurn), lib/agent/fieldExplain (generateFieldExplanation), lib/agent/prescriptionTypes (PRESCRIPTION_FIELDS), lib/agent/reading (generateReading) (+7 more)

### Community 10 - "Architecture Docs (Problem: Composer was bri)"
Cohesion: 0.14
Nodes (14): Problem: Composer was brief and reserved, Voice Rule: Write about BG, never as him, POST /api/kundli/chat Endpoint, CHAT_SYSTEM_PROMPT, FolioEnvelope / AnswerEnvelope Shape, BG Across Teachings Synthesis Section, Core Teaching Section, Crisis Detection Filter (+6 more)

### Community 11 - "Search and Composition"
Cohesion: 0.2
Nodes (10): getDb(), better-sqlite3, sqlite-vec, embed(), fuse() RRF, hybridSearch(), rankerConcept() concept-graph, rankerLexical() FTS5 (+2 more)

### Community 12 - "Astrology Computation (astrology/types.ts)"
Cohesion: 0.2
Nodes (10): astrology/types.ts, astrology/compute.ts, astrology/dasha.ts, astrology/divisional.ts, astrology/doshas.ts, astronomy-engine library, astrology/bhavaChalit (computeBhavaChalit), astrology/kp.ts (+2 more)

### Community 13 - "Search and Composition (lib/compose.ts folio orch)"
Cohesion: 0.22
Nodes (9): lib/compose.ts folio orchestrator, lib/db.ts SQLite + sqlite-vec, aliases (expandAliases/buildFtsQuery), lib/i18n.ts STR table en/hi, lib/openrouter.ts LLM provider, lib/search.ts hybrid retrieval, tailwind.config.ts editorial palette, lib/types.ts AnswerEnvelope etc. (+1 more)

### Community 14 - "Homepage UI (About Page (Brajesh Gauta)"
Cohesion: 0.4
Nodes (5): About Page (Brajesh Gautam bio, bilingual), Footer component, Header component, lib/lang (pickLang), Lang type ('en' | 'hi')

### Community 15 - "Library and Topic Pages"
Cohesion: 0.4
Nodes (5): /library/[video_id] route, YouTube embed iframe (transcript player), formatTime() helper (lib/youtube), TranscriptDrawer component, VideoTile component

### Community 16 - "Search and Composition (composeFolio())"
Cohesion: 0.67
Nodes (2): composeFolio(), SYSTEM_PROMPT (5-paragraph editor rule)

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (1): Next.js TypeScript Type Reference

### Community 18 - "Build Config"
Cohesion: 1.0
Nodes (1): PostCSS Config (Tailwind + Autoprefixer)

### Community 19 - "Page Routes"
Cohesion: 1.0
Nodes (1): NotFound (404)

### Community 20 - "Core API Routes"
Cohesion: 1.0
Nodes (1): GET /api/geocode (Nominatim proxy + tz-lookup)

### Community 21 - "Search and Composition (buildCitationsFromVideos()"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Library and Topic Pages (relatedTopicsForVideos())"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (1): lib/youtube.ts URL helpers

### Community 24 - "LLM Agent Layer (prescriptionTypes.ts (BGP)"
Cohesion: 1.0
Nodes (1): prescriptionTypes.ts (BGPrescription type + fields)

### Community 25 - "Astrology Computation (Chart / FullChart / Birth)"
Cohesion: 1.0
Nodes (1): Chart / FullChart / BirthInput

### Community 26 - "Library and Topic Pages (Whisper Transcription Hin)"
Cohesion: 1.0
Nodes (1): Whisper Transcription Hindi/Hinglish Noise (limit)

## Ambiguous Edges - Review These
- `KundliChart (SVG North-Indian)` → `KundliForm`  [AMBIGUOUS]
  src/components/KundliForm.tsx · relation: semantically_similar_to

## Knowledge Gaps
- **148 isolated node(s):** `Next.js Config (Strict Mode + Image Hosts + sqlite externals)`, `Next.js TypeScript Type Reference`, `tailwind.config.ts editorial palette`, `PostCSS Config (Tailwind + Autoprefixer)`, `tests/astrology/sanity.test.ts` (+143 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 17`** (1 nodes): `Next.js TypeScript Type Reference`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Build Config`** (1 nodes): `PostCSS Config (Tailwind + Autoprefixer)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page Routes`** (1 nodes): `NotFound (404)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Core API Routes`** (1 nodes): `GET /api/geocode (Nominatim proxy + tz-lookup)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Search and Composition (buildCitationsFromVideos()`** (1 nodes): `buildCitationsFromVideos()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Library and Topic Pages (relatedTopicsForVideos())`** (1 nodes): `relatedTopicsForVideos()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `lib/youtube.ts URL helpers`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `LLM Agent Layer (prescriptionTypes.ts (BGP)`** (1 nodes): `prescriptionTypes.ts (BGPrescription type + fields)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Astrology Computation (Chart / FullChart / Birth)`** (1 nodes): `Chart / FullChart / BirthInput`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Library and Topic Pages (Whisper Transcription Hin)`** (1 nodes): `Whisper Transcription Hindi/Hinglish Noise (limit)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `KundliChart (SVG North-Indian)` and `KundliForm`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `FullChart/BirthInput/Chart types` connect `Astrology Computation (AllCharts (D1/D9/D10/D7/D)` to `Astrology Computation (KundliForm)`, `LLM Agent Layer`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `Anchor of Life Project` connect `Architecture Docs` to `Astrology Computation`, `Architecture Docs (Problem: Composer was bri)`, `Architecture Docs (Limit: Alias-table approa)`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `Kundli AI Agent Implementation Plan` connect `Astrology Computation` to `Architecture Docs`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **What connects `Next.js Config (Strict Mode + Image Hosts + sqlite externals)`, `Next.js TypeScript Type Reference`, `tailwind.config.ts editorial palette` to the rest of the system?**
  _148 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Astrology Computation` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Data Ingestion Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._