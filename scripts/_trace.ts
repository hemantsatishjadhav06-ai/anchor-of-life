import './_env';
import { hybridSearch } from '../src/lib/search';

(async () => {
  const q = process.argv[2] ?? 'how will mangal effect me';
  const r = await hybridSearch(q, 8);
  console.log(`Query: "${q}"`);
  console.log(`Matched concepts: ${r.matched_concepts.join(', ')}`);
  console.log(`Alias canonical: ${r.alias_canonical.join(', ')}\n`);
  console.log('Top videos (RRF-fused):');
  r.videos.forEach((v, i) => {
    const t = v.title_match ? '★ TITLE' : '       ';
    console.log(`  ${i+1}. score=${v.rrf_score.toFixed(4)} ${t} sources=[${v.sources.join(',')}]  ${v.title.slice(0, 70)}`);
    console.log(`         best chunk: ${v.best_chunk.start_sec}s-${v.best_chunk.end_sec}s`);
  });
})();
