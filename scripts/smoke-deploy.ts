// Post-deploy smoke test for Anchor of Life kundli flow.
// Usage: npm run smoke -- https://anchor-of-life.onrender.com
//        (defaults to the production URL)
import process from 'node:process';

const URL = process.argv[2] ?? 'https://anchor-of-life.onrender.com';
const sample = {
  date: '1995-08-15',
  time: '11:00',
  tzOffsetMinutes: 330,
  lat: 18.5204,
  lon: 73.8567,
  placeName: 'Pune',
};

async function step(name: string, fn: () => Promise<void>) {
  process.stdout.write(`→ ${name}… `);
  try {
    await fn();
    console.log('OK');
  } catch (e: any) {
    console.log('FAIL:', e.message);
    process.exit(1);
  }
}

async function main() {
  console.log(`\nSmoke testing ${URL}\n`);

  await step('GET /kundli', async () => {
    const r = await fetch(`${URL}/kundli`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
  });

  let chart: any;
  await step('POST /api/kundli', async () => {
    const r = await fetch(`${URL}/api/kundli`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sample),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    const j = await r.json();
    chart = j.chart;
    for (const k of ['d1', 'd7', 'd9', 'd10', 'd12', 'd30', 'dasha', 'doshas', 'yogas', 'kp', 'sayana', 'bhavaChalit']) {
      if (!(k in chart)) throw new Error(`missing ${k}`);
    }
  });

  const tabs = ['overview', 'marriage', 'career', 'children', 'parents', 'hardships', 'doshas-yogas', 'dashas'];
  for (const tab of tabs) {
    await step(`POST /api/kundli/reading [${tab}]`, async () => {
      const r = await fetch(`${URL}/api/kundli/reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: sample, tab, language: 'en' }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
      const j = await r.json();
      if (!j.answer_md || j.answer_md.length < 80) {
        throw new Error(`thin reading (${j.answer_md?.length ?? 0} chars)`);
      }
      // citations may be empty if no transcripts matched — that's a valid state, not a failure
    });
  }

  await step('POST /api/kundli/chat', async () => {
    const r = await fetch(`${URL}/api/kundli/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: sample,
        history: [],
        userMessage: 'What does my Saturn say about my career?',
        language: 'en',
      }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    const j = await r.json();
    if (!j.answer_md) throw new Error('chat returned empty');
  });

  console.log(`\n✓ All smoke checks passed for ${URL}\n`);
}

main().catch(e => {
  console.error('\n✗', e.message);
  process.exit(1);
});
