import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { pickLang } from '@/lib/lang';
import type { Lang } from '@/lib/types';

export default function AboutPage({ searchParams }: { searchParams: { lang?: string } }) {
  const lang: Lang = pickLang(searchParams.lang);
  return (
    <>
      <Header lang={lang} />
      <main className="max-w-folio mx-auto px-6 md:px-0 py-16">
        <p className="citation-meta">{lang === 'hi' ? 'परिचय' : 'About'}</p>
        <h1 className={`mt-2 font-display text-4xl md:text-5xl leading-tight tracking-tighter-display text-ink ${lang === 'hi' ? 'font-devanagari' : ''}`}>
          {lang === 'hi' ? 'श्री ब्रजेश गौतम' : 'Shri Brajesh Gautam'}
        </h1>

        <div className={`folio-prose mt-10 ${lang === 'hi' ? 'lang-hi' : ''}`}>
          {lang === 'hi' ? (
            <>
              <p>श्री ब्रजेश गौतम तीन दशकों से अधिक समय से एक प्रसिद्ध ज्योतिषाचार्य, वास्तु विशेषज्ञ और आध्यात्मिक मार्गदर्शक के रूप में मानवता की सेवा कर रहे हैं। उन्होंने भारत, यू.के., कनाडा, यू.एस.ए., नेपाल — सीमाओं के पार हजारों लोगों को तनाव, अवसाद और मानसिक पीड़ा से बाहर निकालने में सहायता की है।</p>
              <p>हर रविवार वे आध्यात्म पर निःशुल्क कक्षाएँ संचालित करते हैं — जिनमें पूरे विश्व के लोग भाग लेते हैं। उनकी कक्षाएँ YouTube चैनल "<em>The Anchor of Life with Brajesh Gautam</em>" पर उपलब्ध हैं।</p>
              <p>2022 में उन्होंने <em>Spiritual Nectar of Wisdom (SNOW)</em> ट्रस्ट की स्थापना की — जो भारत और कनाडा में पंजीकृत एक गैर-लाभकारी संस्था है। SNOW का उद्देश्य हर व्यक्ति को उसके अंतर ज्ञान से जोड़ना है। ट्रस्ट गरीबों, विकलांगों, अनाथों, वृद्धों और वंचित महिलाओं की सेवा करता है — जाति, धर्म और मत के भेदभाव के बिना।</p>
              <p>यह स्थल उनकी रिकॉर्डेड शिक्षाओं का एक खुला, निःशुल्क संग्रह है। यह उन शिक्षाओं को संरक्षित करने और हर भाषा में, हर समय, हर व्यक्ति तक पहुँचाने का प्रयत्न है। यह ब्रजेश जी का व्यक्तिगत परामर्श नहीं — व्यक्तिगत मार्गदर्शन के लिए कृपया उनसे सीधे संपर्क करें।</p>
            </>
          ) : (
            <>
              <p>Shri Brajesh Gautam is a renowned astrologer, vastu expert, and spiritual mentor who has been serving humanity for over three decades. He has helped thousands of people across India, the UK, Canada, the USA, and Nepal come out from stress, depression, and mental agony.</p>
              <p>Every Sunday he conducts free classes on spirituality, attended by participants worldwide. His classes are available on the YouTube channel <em>"The Anchor of Life with Brajesh Gautam."</em></p>
              <p>In 2022 he established <em>Spiritual Nectar of Wisdom (SNOW)</em> — a non-profit trust registered in India and Canada — to connect ordinary people with their inner knowledge. SNOW helps the poor, the differently-abled, orphans, the elderly, and underprivileged women, irrespective of caste, creed, colour, or religion.</p>
              <p>This site is an open, free archive of his recorded teachings. Its intention is preservation — to keep his words available to anyone, anywhere, in their language, for as long as the internet exists. It is not a substitute for personal consultation. For individual guidance, please contact Brajesh ji directly.</p>
            </>
          )}
        </div>

        <hr className="rule" />

        <section>
          <p className="citation-meta mb-4">{lang === 'hi' ? 'संपर्क' : 'Contact'}</p>
          <ul className="space-y-2 text-ink-soft">
            <li>{lang === 'hi' ? 'पता' : 'Address'}: <span className="font-display italic">Vikaspuri, Delhi - 110018, India</span></li>
            <li>{lang === 'hi' ? 'फ़ोन' : 'Phone'}: <a href="tel:+919717194880" className="hover:underline underline-offset-4">+91 97171 94880</a></li>
            <li>{lang === 'hi' ? 'समय' : 'Hours'}: 12:00 PM – 5:00 PM</li>
            <li>{lang === 'hi' ? 'अपॉइंटमेंट' : 'Appointment'}: <a href="https://www.brajeshgautam.com/Contact-us" target="_blank" rel="noopener" className="hover:underline underline-offset-4">brajeshgautam.com</a></li>
            <li>SNOW Trust: <a href="https://www.spiritualnectorofwisdom.org/" target="_blank" rel="noopener" className="hover:underline underline-offset-4">spiritualnectorofwisdom.org</a></li>
          </ul>
        </section>

        <hr className="rule" />

        <section>
          <p className="citation-meta mb-4">{lang === 'hi' ? 'इस संग्रह के बारे में' : 'About this archive'}</p>
          <p className="text-ink-soft leading-relaxed">
            {lang === 'hi'
              ? 'इस वेबसाइट के उत्तर AI द्वारा रचे गए हैं — परंतु केवल ब्रजेश जी की रिकॉर्डेड शिक्षाओं के आधार पर। हर उत्तर अपने स्रोत वीडियो, समय-चिह्न और मूल वाक्य के साथ आता है। यदि किसी प्रश्न का उत्तर शिक्षाओं में नहीं मिलता, तो AI यह स्पष्ट रूप से कहता है — कुछ भी अनुमान नहीं लगाता।'
              : 'Answers on this site are composed by an AI — but only from Brajesh ji’s recorded teachings, never invented. Every answer surfaces its source video, the exact timestamp, and the original quote. If a question cannot be answered from the teachings, the AI says so plainly rather than inventing.'}
          </p>
        </section>
      </main>
      <Footer lang={lang} />
    </>
  );
}
