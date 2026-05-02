/**
 * Eval harness — run a fixed set of (query, expected canonical video) pairs
 * through hybridSearch and report whether each query's expected video lands
 * in the top-3 results.
 *
 * Run: npm run eval
 * CI gate: ≥10/12 must pass (stay above 80%) for any PR touching retrieval.
 */
import './_env';
import { hybridSearch } from '../src/lib/search';
import { getDb, closeDb } from '../src/lib/db';

interface EvalCase {
  q: string;
  expect_title_match: RegExp;   // expected canonical video's title pattern
  lang: 'en' | 'hi';
  notes?: string;
}

const CASES: EvalCase[] = [
  { q: 'how will mangal effect me',         lang: 'en', expect_title_match: /Planet Mars|मंगल/i },
  { q: 'मंगल का असर क्या है',                lang: 'hi', expect_title_match: /Planet Mars|मंगल/i },
  { q: 'Saturn in 7th house',                lang: 'en', expect_title_match: /Planet Saturn|शनि/i },
  { q: 'सप्तम भाव में शनि',                  lang: 'hi', expect_title_match: /Planet Saturn|शनि|Saptam/i },
  { q: 'pitr dosh remedies',                 lang: 'en', expect_title_match: /Pitr|Pitra|Pitrr|Ketu|Chitragupta|Ancestor|Astral|पितृ|पितर/i },
  { q: 'jupiter remedies',                   lang: 'en', expect_title_match: /Planet Jupiter|बृहस्पति/i },
  { q: 'how to deal with anger',             lang: 'en', expect_title_match: /Anger|क्रोध/i },
  { q: 'क्रोध को कैसे संभालें',                lang: 'hi', expect_title_match: /Anger|क्रोध/i },
  { q: 'feeling alone',                      lang: 'en', expect_title_match: /Tinku|alone|Munna|loneliness|self love|akela/i },
  { q: 'sade sati',                          lang: 'en', expect_title_match: /Saturn|शनि|Sade/i },
  { q: 'what is munna',                      lang: 'en', expect_title_match: /Munna|Tinku/i },
  { q: 'how to manifest',                    lang: 'en', expect_title_match: /MANIFEST|PUMP|Preliv|Vision/i },
];

(async () => {
  const results: Array<{ q: string; pass: boolean; rank: number | null; top: string }> = [];
  let pass = 0;
  for (const c of CASES) {
    const r = await hybridSearch(c.q, 6);
    let rank: number | null = null;
    for (let i = 0; i < r.videos.length; i++) {
      if (c.expect_title_match.test(r.videos[i].title)) { rank = i + 1; break; }
    }
    const ok = rank !== null && rank <= 3;
    if (ok) pass++;
    results.push({ q: c.q, pass: ok, rank, top: r.videos[0]?.title?.slice(0, 60) ?? '(none)' });
    const tag = ok ? '✓ PASS' : '✗ FAIL';
    const rk = rank === null ? 'not in top 6' : `rank ${rank}`;
    console.log(`${tag}  ${rk.padEnd(13)}  "${c.q}"`);
    if (!ok) console.log(`        top hit was: ${r.videos[0]?.title?.slice(0, 80) ?? '(none)'}`);
  }
  console.log();
  console.log(`Result: ${pass}/${CASES.length} passed (${Math.round(pass / CASES.length * 100)}%)`);
  closeDb();
  if (pass < Math.ceil(CASES.length * 0.8)) {
    console.error('FAIL: below 80% threshold');
    process.exit(1);
  }
})();
