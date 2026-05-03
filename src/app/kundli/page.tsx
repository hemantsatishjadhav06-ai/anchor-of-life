import Header from '@/components/Header';
import Footer from '@/components/Footer';
import KundliForm from '@/components/KundliForm';
import { pickLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';

export default function KundliPage({ searchParams }: { searchParams: { lang?: string } }) {
  const lang = pickLang(searchParams.lang);
  return (
    <>
      <Header lang={lang} />
      <main className="max-w-wide mx-auto px-6 md:px-10 py-10 md:py-16">
        <div className="max-w-folio mx-auto">
          <p className="citation-meta">{lang === 'hi' ? 'कुंडली विश्लेषक' : 'Kundli Analyzer'}</p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl tracking-tighter-display text-ink leading-[1.05]">
            {lang === 'hi' ? (
              <span className="font-devanagari font-medium">अपनी कुंडली का विश्लेषण करें</span>
            ) : (
              <>Get your <em className="text-vermilion italic font-light">kundli</em> read.</>
            )}
          </h1>
          <p className="mt-5 text-ink leading-relaxed font-medium">
            {lang === 'hi'
              ? 'अपनी जन्म तिथि, समय और स्थान दर्ज करें। आपको आपकी कुंडली, ग्रह स्थिति, और ब्रजेश जी के प्रसिद्ध 20-क्षेत्र परामर्श प्रारूप में सुझाव मिलेंगे।'
              : "Enter your birth date, time, and place — anywhere in the world. You'll get your kundli (birth chart), planet positions, detected doshas, and recommendations in Brajesh ji's signature 20-field consultation format."}
          </p>
        </div>

        <hr className="rule" />

        <KundliForm lang={lang} />
      </main>
      <Footer lang={lang} />
    </>
  );
}
