// Transcript-grounding verification for the kundli reading agent.
// Runs the agent on 5 fixed birth charts × 8 tabs, then for each
// claim sentence checks that significant words from the claim appear
// in the cited transcript chunk. Reports pass/fail and a fabrication
// rate. Fail rate > 20% exits non-zero.
//
// Usage: npm run verify:readings   (requires OPENROUTER_API_KEY)

import 'dotenv/config';
import { computeFullChart } from '../src/lib/astrology/compute';
import { generateReading } from '../src/lib/agent/reading';
import type { TabKey } from '../src/lib/agent/chartContext';
import type { BirthInput } from '../src/lib/astrology/types';

const FIXTURES: BirthInput[] = [
  { date: '1990-06-15', time: '08:30', tzOffsetMinutes: 330, lat: 28.7041, lon: 77.1025, placeName: 'New Delhi' },
  { date: '1985-11-02', time: '14:00', tzOffsetMinutes: 330, lat: 19.0760, lon: 72.8777, placeName: 'Mumbai' },
  { date: '1972-03-21', time: '21:15', tzOffsetMinutes: 330, lat: 12.9716, lon: 77.5946, placeName: 'Bengaluru' },
  { date: '1995-08-15', time: '11:00', tzOffsetMinutes: 330, lat: 18.5204, lon: 73.8567, placeName: 'Pune' },
  { date: '2000-01-01', time: '00:00', tzOffsetMinutes: 330, lat: 22.5726, lon: 88.3639, placeName: 'Kolkata' },
];

const TABS: TabKey[] = [
  'overview', 'marriage', 'career', 'children',
  'parents', 'hardships', 'doshas-yogas', 'dashas',
];

const STOPWORDS = new Set([
  'the','a','an','is','are','was','were','of','for','to','in','on','at','by',
  'with','from','this','that','his','her','its','it','as','and','or','but','if',
  'when','then','than','so','about','what','which','who','where','will','would',
  'has','have','had','be','been','being','do','does','did','can','could','should',
  'jee','ji','one','also','very','much','many','some','any','all','no','not','only',
]);

function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[a-zA-Zऀ-ॿ]{4,}/g) ?? [])
    .filter(t => !STOPWORDS.has(t));
}

(async () => {
  let passed = 0, failed = 0;
  const failures: string[] = [];

  for (const input of FIXTURES) {
    process.stdout.write(`\n${input.placeName} ${input.date}…`);
    const fc = computeFullChart(input);
    for (const tab of TABS) {
      try {
        const env = await generateReading(tab, fc, 'en');
        const sentences = env.answer_md.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10);
        for (const sent of sentences) {
          const m = sent.match(/\{\{cite:(\d+)\}\}/);
          if (!m) continue;                          // uncited sentence — not counted
          const idx = parseInt(m[1]) - 1;
          const cit = env.citations[idx];
          if (!cit) {
            failed++;
            failures.push(`${input.placeName}/${tab}: cite [${m[1]}] points outside citation array`);
            continue;
          }
          const claim = new Set(tokenize(sent.replace(/\{\{cite:\d+\}\}/g, '')));
          const source = new Set(tokenize(cit.quote));
          const overlap = [...claim].filter(w => source.has(w)).length;
          const ratio = claim.size === 0 ? 1 : overlap / claim.size;
          if (ratio >= 0.20) passed++;
          else {
            failed++;
            failures.push(`${input.placeName}/${tab}: overlap ${ratio.toFixed(2)}: "${sent.slice(0, 100)}…"`);
          }
        }
        process.stdout.write('.');
      } catch (e: any) {
        failed++;
        failures.push(`${input.placeName}/${tab}: ${e.message ?? e}`);
        process.stdout.write('!');
      }
    }
  }

  const total = passed + failed;
  const rate = total === 0 ? 0 : passed / total;
  console.log(`\n\n=== ${passed}/${total} cited claims grounded (${(rate * 100).toFixed(1)}%) ===\n`);
  if (failures.length > 0) {
    console.log('Failures:\n' + failures.slice(0, 20).map(f => '  - ' + f).join('\n'));
  }
  if (1 - rate > 0.20) {
    console.log('\n⚠  Fail rate > 20% — tighten the prompt and re-run.');
    process.exit(1);
  }
  console.log('\n✓ Verification passed.');
})().catch(e => {
  console.error(e);
  process.exit(1);
});
