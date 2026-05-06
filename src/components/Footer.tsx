import Link from 'next/link';
import type { Lang } from '@/lib/types';

export default function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="mt-32 border-t border-ink-line/60">
      <div className="max-w-wide mx-auto px-6 md:px-10 py-12 grid md:grid-cols-3 gap-10">
        <div>
          <p className="font-display text-lg leading-snug text-ink">
            <span className="font-devanagari">जीवन का आधार</span>
            <br />
            <span className="text-ink-mute font-sans text-sm uppercase tracking-wider">The Anchor of Life</span>
          </p>
          <p className="mt-4 text-sm text-ink-mute leading-relaxed max-w-xs">
            {lang === 'hi'
              ? 'श्री ब्रजेश गौतम जी की रिकॉर्डेड शिक्षाओं का संग्रह — स्वतंत्र, निःशुल्क, सदा उपलब्ध।'
              : "A digital archive of Shri Brajesh Gautam ji's recorded teachings — open, free, always available."}
          </p>
          <a
            href="https://anchoroflife.com"
            target="_blank"
            rel="noopener"
            className="mt-5 inline-flex items-center gap-1.5 text-[0.78rem] font-bold tracking-[0.1em] uppercase text-ink border border-ink/25 px-3 py-1.5 hover:border-vermilion hover:text-vermilion transition-colors"
          >
            anchoroflife.com <span className="text-[0.9em]">↗</span>
          </a>
        </div>
        <div>
          <p className="citation-meta mb-3">{lang === 'hi' ? 'खोजें' : 'Explore'}</p>
          <ul className="space-y-2 text-[0.95rem]">
            <li><Link href={`/library?lang=${lang}`} className="btn-text">{lang === 'hi' ? 'पुस्तकालय' : 'The Library'}</Link></li>
            <li><Link href={`/?lang=${lang}#topics`} className="btn-text">{lang === 'hi' ? 'जीवन प्रसंग' : 'Life situations'}</Link></li>
            <li><Link href={`/about?lang=${lang}`} className="btn-text">{lang === 'hi' ? 'ब्रजेश जी के बारे में' : 'About Brajesh ji'}</Link></li>
          </ul>
        </div>
        <div>
          <p className="citation-meta mb-3">{lang === 'hi' ? 'व्यक्तिगत परामर्श' : 'For personal guidance'}</p>
          <ul className="space-y-2 text-[0.95rem]">
            <li><a href="https://www.brajeshgautam.com/Contact-us" target="_blank" rel="noopener" className="btn-text">{lang === 'hi' ? 'अपॉइंटमेंट बुक करें' : 'Book a consultation'}</a></li>
            <li><a href="https://www.spiritualnectorofwisdom.org/" target="_blank" rel="noopener" className="btn-text">SNOW Trust</a></li>
            <li><a href="https://www.youtube.com/@officialbrajeshgautam" target="_blank" rel="noopener" className="btn-text">YouTube channel</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-wide mx-auto px-6 md:px-10 pb-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-ink-mute max-w-prose">
          {lang === 'hi'
            ? 'उत्तर ब्रजेश जी की रिकॉर्डेड शिक्षाओं से लिए जाते हैं। शिक्षाएँ © ब्रजेश गौतम। यह स्थल सदाबहार रहे — यही हमारा संकल्प।'
            : "Answers are drawn from Brajesh ji's recorded teachings. Teachings © Brajesh Gautam. May this site outlast all of us — that is the intention."}
        </p>
        <p className="text-[0.72rem] font-bold tracking-[0.14em] uppercase text-ink-mute">
          {lang === 'hi' ? '© ब्रजेश गौतम' : '© Brajesh Gautam'}
        </p>
      </div>
    </footer>
  );
}
