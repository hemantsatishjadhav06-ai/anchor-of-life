import './_env';
import fs from 'node:fs';
import path from 'node:path';
import { getDb, closeDb } from '../src/lib/db';

const GRAPH_PATH = '/Users/hemantjadhav/untitled folder/graphify-out/graph.json';

interface GraphNode {
  id: string;
  label: string;
  source_file?: string;
  community?: number;
  community_label?: string;
  degree?: number;
  [k: string]: any;
}
interface GraphLink {
  source: string;
  target: string;
  relation?: string;
  confidence?: string;
  weight?: number;
  [k: string]: any;
}
interface GraphJson {
  nodes: GraphNode[];
  links?: GraphLink[];
  edges?: GraphLink[];
  communities?: Record<string, string[]>;
  community_labels?: Record<string, string>;
  cohesion?: Record<string, number>;
}

function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/[ऀ-ॿ]+/g, '')      // strip Devanagari for slug
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Map a graphify source_file (curated_v1/...) to the YouTube video_id by title heuristics.
// curated_v1 names are not YouTube IDs, so we resolve by matching title fragments.
function buildSourceFileToVideoId(db: any): Map<string, string> {
  // Pull all video titles
  const videos = db.prepare('SELECT video_id, title FROM videos').all() as Array<{ video_id: string; title: string }>;

  // Anchor of Life curated subset: filename like "Transcript_01_Chamko" → match title "Chamko"
  // Jyotish Vidya: filename like "01_Ep_1.txt" → match "Ep. 1" or "Episode 1"
  const map = new Map<string, string>();

  function lookup(filename: string): string | null {
    // Anchor of Life
    const aol = filename.match(/^Transcript_\d+_(.+?)\.txt$/i);
    if (aol) {
      // Strip placeholder underscores in concatenated portion
      const fragments = aol[1].replace(/_+/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
      const head = fragments[0]; // first meaningful word
      // Score titles by overlap with all fragments
      let best: { vid: string; score: number } | null = null;
      for (const v of videos) {
        const tl = v.title.toLowerCase();
        let score = 0;
        for (const w of fragments) {
          if (w.length < 3) continue;
          if (tl.includes(w.toLowerCase())) score++;
        }
        // Boost if first word matches at start of title
        if (head && tl.startsWith(head.toLowerCase())) score += 2;
        if (score > 0 && (!best || score > best.score)) best = { vid: v.video_id, score };
      }
      return best?.vid ?? null;
    }
    // Jyotish Vidya
    const jv = filename.match(/^(\d+)_Ep_(\d+)\.txt$/i);
    if (jv) {
      const ep = parseInt(jv[2]);
      const epPats = [
        new RegExp(`Ep\\.?\\s*${ep}\\b`, 'i'),
        new RegExp(`Episode\\s*${ep}\\b`, 'i'),
      ];
      const candidates = videos.filter(v => /jyotish/i.test(v.title));
      for (const pat of epPats) {
        const hit = candidates.find(v => pat.test(v.title));
        if (hit) return hit.video_id;
      }
      // Some Jyotish episodes don't say "Jyotish Vidya" — try broader
      for (const pat of epPats) {
        const hit = videos.find(v => pat.test(v.title));
        if (hit) return hit.video_id;
      }
    }
    return null;
  }

  // Walk concept source_files (we'll pass them in)
  return new Proxy(map, {
    get(target, prop) {
      if (prop === 'resolve') return (filename: string) => {
        if (target.has(filename)) return target.get(filename);
        const id = lookup(filename);
        if (id) target.set(filename, id);
        return id;
      };
      return (target as any)[prop];
    },
  }) as any;
}

function main() {
  if (!fs.existsSync(GRAPH_PATH)) {
    console.error('graph.json not found at', GRAPH_PATH);
    process.exit(1);
  }
  const g = JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf-8')) as GraphJson;
  const links = g.links ?? g.edges ?? [];

  const db = getDb();

  // Compute degree from links
  const deg = new Map<string, number>();
  for (const l of links) {
    deg.set(l.source, (deg.get(l.source) ?? 0) + 1);
    deg.set(l.target, (deg.get(l.target) ?? 0) + 1);
  }

  // Communities: graph.json (graphify export) embeds community on nodes; double-check
  // If communities/labels also at top level, use those.
  const communityLabels = g.community_labels ?? {};
  const cohesion = g.cohesion ?? {};

  // Build per-community size + label
  const perCommunity = new Map<number, { size: number; label: string; cohesion: number }>();
  for (const n of g.nodes) {
    const cid = n.community ?? null;
    if (cid === null || cid === undefined) continue;
    const e = perCommunity.get(cid) ?? { size: 0, label: communityLabels[String(cid)] ?? `Community ${cid}`, cohesion: cohesion[String(cid)] ?? 0 };
    e.size++;
    e.label = communityLabels[String(cid)] ?? n.community_label ?? e.label;
    perCommunity.set(cid, e);
  }

  // Insert topics
  const insertTopic = db.prepare(`
    INSERT OR REPLACE INTO topics (community_id, label, size, cohesion, slug)
    VALUES (?, ?, ?, ?, ?)
  `);
  const usedSlugs = new Set<string>();
  const tx1 = db.transaction(() => {
    db.prepare('DELETE FROM topics').run();
    for (const [cid, info] of perCommunity) {
      let slug = slugify(info.label) || `topic-${cid}`;
      let s = slug, i = 2;
      while (usedSlugs.has(s)) { s = `${slug}-${i++}`; }
      usedSlugs.add(s);
      insertTopic.run(cid, info.label, info.size, info.cohesion, s);
    }
  });
  tx1();

  // Insert concepts
  const insertConcept = db.prepare(`
    INSERT OR REPLACE INTO concepts (id, label, community_id, community_label, degree, source_file)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const tx2 = db.transaction(() => {
    db.prepare('DELETE FROM concepts').run();
    for (const n of g.nodes) {
      const cid = (n.community ?? null) as number | null;
      const lbl = cid !== null ? perCommunity.get(cid)?.label ?? null : null;
      insertConcept.run(n.id, n.label, cid, lbl, deg.get(n.id) ?? 0, n.source_file ?? null);
    }
  });
  tx2();

  // Insert edges
  const insertEdge = db.prepare(`
    INSERT OR REPLACE INTO concept_edges (source_id, target_id, relation, confidence, weight)
    VALUES (?, ?, ?, ?, ?)
  `);
  const tx3 = db.transaction(() => {
    db.prepare('DELETE FROM concept_edges').run();
    for (const l of links) {
      insertEdge.run(l.source, l.target, l.relation ?? null, l.confidence ?? null, l.weight ?? 1);
    }
  });
  tx3();

  // Concept → video linkage via source_file → video_id heuristic
  const resolver = buildSourceFileToVideoId(db) as any;
  const insertCV = db.prepare(`INSERT OR REPLACE INTO concept_videos (concept_id, video_id) VALUES (?, ?)`);
  let linked = 0, unresolved = 0;
  const seenLinks = new Set<string>();
  const tx4 = db.transaction(() => {
    db.prepare('DELETE FROM concept_videos').run();
    for (const n of g.nodes) {
      const sf = n.source_file;
      if (!sf) continue;
      const filename = path.basename(sf);
      const vid = resolver.resolve(filename);
      if (!vid) { unresolved++; continue; }
      const key = `${n.id}::${vid}`;
      if (seenLinks.has(key)) continue;
      seenLinks.add(key);
      insertCV.run(n.id, vid);
      linked++;
    }
  });
  tx4();

  // Auto-seed featured cards based on top communities (idempotent — will overwrite if existing)
  const cards = [
    { slot: 1, slug: 'relationships',  ids: [4],            en: 'Relationships & Marriage', hi: 'रिश्ते और विवाह',     dEn: 'On love, marriage, separation, partnership.',                       dHi: 'प्रेम, विवाह, सहचर्य पर।' },
    { slot: 2, slug: 'fate-decisions', ids: [5, 9],         en: 'Karma, Fate & Free Will',   hi: 'कर्म, भाग्य और प्रयत्न', dEn: 'On karma, prarabdh, the karmic ledger of paap and punya.',          dHi: 'कर्म, प्रारब्ध, पाप-पुण्य पर।' },
    { slot: 3, slug: 'family-ancestors', ids: [3, 21],      en: 'Family & Ancestors',        hi: 'परिवार और पितृगण',    dEn: 'On parents, ancestors, lineage, the astral world.',                  dHi: 'माता-पिता, पूर्वज, पितृ लोक पर।' },
    { slot: 4, slug: 'mind-health',    ids: [17, 18],       en: 'Mind, Sleep & Health',      hi: 'मन, नींद और स्वास्थ्य', dEn: 'On stress, the brain battery, conscious-subconscious-unconscious.',  dHi: 'तनाव, मस्तिष्क की ऊर्जा, चेतन-अवचेतन पर।' },
    { slot: 5, slug: 'inner-self',     ids: [1, 15],        en: 'The Inner Self & Ego',      hi: 'अंतस् और अहंकार',       dEn: 'On Munna, Tinku, the inner spark, surrendering to the witness.',     dHi: 'मुन्ना, टिंकू, साक्षी भाव पर।' },
    { slot: 6, slug: 'wealth-work',    ids: [11, 24],       en: 'Money, Work & Service',     hi: 'धन, कार्य और सेवा',     dEn: 'On Lakshmi, Venus, the 9th house, the meaning of daan.',             dHi: 'लक्ष्मी, शुक्र, नवम भाव, दान पर।' },
    { slot: 7, slug: 'death-letting-go', ids: [8, 25],      en: 'Death & Letting Go',        hi: 'मृत्यु और छोड़ना',       dEn: 'On Pluto, Yamraj, transitions, the art of leaving.',                  dHi: 'प्लूटो, यमराज, मृत्यु, छोड़ने की कला पर।' },
    { slot: 8, slug: 'desire-manifestation', ids: [7, 22],  en: 'Desire & Manifestation',    hi: 'इच्छा और साकार',         dEn: 'On Neptune, Mars, the PUMP framework, what to do with desire.',      dHi: 'नेप्ट्यून, मंगल, इच्छा, PUMP पर।' },
  ];
  const insertCard = db.prepare(`
    INSERT OR REPLACE INTO featured_cards (slot, slug, community_ids, label_en, label_hi, description_en, description_hi)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const tx5 = db.transaction(() => {
    db.prepare('DELETE FROM featured_cards').run();
    for (const c of cards) {
      insertCard.run(c.slot, c.slug, JSON.stringify(c.ids), c.en, c.hi, c.dEn, c.dHi);
    }
  });
  tx5();

  console.log(`graph: ${g.nodes.length} concepts, ${links.length} edges`);
  console.log(`topics: ${perCommunity.size} communities`);
  console.log(`linked: ${linked} concept→video pairs (${unresolved} concepts had unresolved source_files)`);
  console.log(`featured cards: ${cards.length} seeded`);
  closeDb();
}

main();
