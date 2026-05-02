import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FolioAnswer from '@/components/FolioAnswer';
import SearchBox from '@/components/SearchBox';
import { pickLang } from '@/lib/lang';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AskPage({ searchParams }: { searchParams: { q?: string; lang?: string } }) {
  const lang = pickLang(searchParams.lang);
  const q = (searchParams.q ?? '').trim();
  if (!q) redirect(`/?lang=${lang}`);

  return (
    <>
      <Header lang={lang} />
      <main className="max-w-wide mx-auto px-6 md:px-10 py-10">
        {/* Inline search to ask another question */}
        <div className="max-w-folio mx-auto mb-12">
          <SearchBox lang={lang} initial={q} />
        </div>
        <FolioAnswer question={q} lang={lang} />
      </main>
      <Footer lang={lang} />
    </>
  );
}
