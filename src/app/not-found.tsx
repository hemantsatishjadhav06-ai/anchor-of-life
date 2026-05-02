import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="max-w-folio mx-auto px-6 py-32 text-center">
      <p className="citation-meta">404</p>
      <h1 className="mt-3 font-display text-4xl text-ink">Page not found.</h1>
      <p className="mt-4 text-ink-soft">
        <span className="font-devanagari">यह पृष्ठ नहीं मिला।</span>
      </p>
      <p className="mt-10">
        <Link href="/" className="btn-text">← Return to the library</Link>
      </p>
    </main>
  );
}
