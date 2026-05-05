'use client';
// Temporary stub — full tabbed UI lands in next commit.
import { Suspense } from 'react';

function ResultInner() {
  return (
    <main className="max-w-folio mx-auto px-6 py-20">
      <p className="text-ink-soft">Loading kundli result page (rebuild in progress)...</p>
    </main>
  );
}

export default function KundliResultPage() {
  return (
    <Suspense fallback={<p className="p-10">Loading…</p>}>
      <ResultInner />
    </Suspense>
  );
}
