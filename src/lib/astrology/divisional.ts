// Generic divisional chart sign computation per BPHS rules.
// Returns the sign index (0-11) of a planet's longitude in chart D-N.

export function divisionalSignOf(longitude: number, n: number): number {
  const lon = ((longitude % 360) + 360) % 360;
  const signIdx = Math.floor(lon / 30);
  const degInSign = lon - signIdx * 30;

  switch (n) {
    case 1:
      return signIdx;

    case 7: {
      // Saptamsa: odd signs start at same; even signs start at 7th-from-same.
      const part = Math.floor(degInSign * 7 / 30);
      const start = signIdx % 2 === 0 ? signIdx : (signIdx + 6) % 12;
      return (start + part) % 12;
    }

    case 9: {
      // Navamsa — matches existing compute.ts navamsaSignOf for back-compat.
      const navIdx = Math.floor(degInSign * 3 / 10);
      let startSign;
      if (signIdx % 3 === 0) startSign = signIdx;
      else if (signIdx % 3 === 1) startSign = (signIdx + 8) % 12;
      else startSign = (signIdx + 4) % 12;
      return (startSign + navIdx) % 12;
    }

    case 10: {
      // Dasamsa: odd signs start at same; even at 9th-from-same.
      const part = Math.floor(degInSign * 10 / 30);
      const start = signIdx % 2 === 0 ? signIdx : (signIdx + 8) % 12;
      return (start + part) % 12;
    }

    case 12: {
      // Dwadasamsa: always starts at same sign, 2.5° per part.
      const part = Math.floor(degInSign / 2.5);
      return (signIdx + part) % 12;
    }

    case 30: {
      // Trimsamsa per BPHS — different rules for odd vs even signs.
      // Odd:  Mars 0–5° → Aries, Saturn 5–10° → Aquarius, Jupiter 10–18° → Sagittarius,
      //       Mercury 18–25° → Gemini, Venus 25–30° → Libra
      // Even: Venus 0–5° → Taurus, Mercury 5–12° → Virgo, Jupiter 12–20° → Pisces,
      //       Saturn 20–25° → Capricorn, Mars 25–30° → Scorpio
      const oddTab = [
        { upTo: 5, sign: 0 },   // Aries
        { upTo: 10, sign: 10 }, // Aquarius
        { upTo: 18, sign: 8 },  // Sagittarius
        { upTo: 25, sign: 2 },  // Gemini
        { upTo: 30, sign: 6 },  // Libra
      ];
      const evenTab = [
        { upTo: 5, sign: 1 },   // Taurus
        { upTo: 12, sign: 5 },  // Virgo
        { upTo: 20, sign: 11 }, // Pisces
        { upTo: 25, sign: 9 },  // Capricorn
        { upTo: 30, sign: 7 },  // Scorpio
      ];
      const tab = signIdx % 2 === 0 ? oddTab : evenTab;
      for (const row of tab) {
        if (degInSign < row.upTo) return row.sign;
      }
      return tab[tab.length - 1].sign;
    }

    default:
      throw new Error(`Unsupported divisional chart D-${n}`);
  }
}
