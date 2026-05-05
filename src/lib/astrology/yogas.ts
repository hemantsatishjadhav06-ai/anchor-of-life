// V1 yoga detection: Raj, Dhana, Gajakesari, Pancha-Mahapurusha.
import type { Chart, YogaResult, PlanetName } from './types';
import { lordOfHouse } from './compute';

const KENDRA = [1, 4, 7, 10];
const TRIKONA = [1, 5, 9];

export function detectRajYogas(d1: Chart): YogaResult[] {
  const out: YogaResult[] = [];
  for (const k of KENDRA) {
    const kLord = lordOfHouse(d1, k);
    const kPos = d1.planets.find(p => p.name === kLord)!;
    for (const t of TRIKONA) {
      if (k === t) continue;
      const tLord = lordOfHouse(d1, t);
      if (tLord === kLord) continue;
      const tPos = d1.planets.find(p => p.name === tLord)!;
      if (kPos.signIndex === tPos.signIndex) {
        out.push({
          key: `raj-${k}-${t}`,
          name: 'Raj Yoga',
          planets: [kLord, tLord],
          detail: `Lords of houses ${k} and ${t} (${kLord}, ${tLord}) conjunct in ${kPos.sign}`,
        });
      }
    }
  }
  return out;
}

export function detectDhanaYogas(d1: Chart): YogaResult[] {
  const pairs: Array<[number, number]> = [[2, 11], [5, 9]];
  const out: YogaResult[] = [];
  for (const [a, b] of pairs) {
    const la = lordOfHouse(d1, a);
    const lb = lordOfHouse(d1, b);
    if (la === lb) continue;
    const pa = d1.planets.find(p => p.name === la)!;
    const pb = d1.planets.find(p => p.name === lb)!;
    if (pa.signIndex === pb.signIndex) {
      out.push({
        key: `dhana-${a}-${b}`,
        name: 'Dhana Yoga',
        planets: [la, lb],
        detail: `Lords of houses ${a} and ${b} (${la}, ${lb}) conjunct in ${pa.sign}`,
      });
    }
  }
  return out;
}

export function detectGajakesari(d1: Chart): YogaResult[] {
  const moon = d1.planets.find(p => p.name === 'Moon')!;
  const jup = d1.planets.find(p => p.name === 'Jupiter')!;
  const diff = ((jup.signIndex - moon.signIndex + 12) % 12) + 1;
  if (KENDRA.includes(diff)) {
    return [{
      key: 'gajakesari',
      name: 'Gajakesari Yoga',
      planets: ['Jupiter', 'Moon'],
      detail: `Jupiter in ${diff}th from Moon (kendra)`,
    }];
  }
  return [];
}

const OWN_SIGNS: Record<PlanetName, number[]> = {
  Sun:     [4],
  Moon:    [3],
  Mars:    [0, 7],
  Mercury: [2, 5],
  Jupiter: [8, 11],
  Venus:   [1, 6],
  Saturn:  [9, 10],
  Rahu:    [],
  Ketu:    [],
};

const EXALTATION: Record<PlanetName, number> = {
  Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3,
  Venus: 11, Saturn: 6, Rahu: -1, Ketu: -1,
};

const PMP_NAMES: Partial<Record<PlanetName, string>> = {
  Mars: 'Ruchaka',
  Mercury: 'Bhadra',
  Jupiter: 'Hamsa',
  Venus: 'Malavya',
  Saturn: 'Shasha',
};

export function detectPanchaMahapurusha(d1: Chart): YogaResult[] {
  const out: YogaResult[] = [];
  for (const name of Object.keys(PMP_NAMES) as PlanetName[]) {
    const pos = d1.planets.find(p => p.name === name)!;
    const inOwn = OWN_SIGNS[name].includes(pos.signIndex);
    const exalted = EXALTATION[name] === pos.signIndex;
    const inKendra = KENDRA.includes(pos.house);
    if ((inOwn || exalted) && inKendra) {
      out.push({
        key: `pmp-${name.toLowerCase()}`,
        name: `${PMP_NAMES[name]} Yoga`,
        planets: [name],
        detail: `${name} ${exalted ? 'exalted' : 'in own sign'} (${pos.sign}) in house ${pos.house} (kendra)`,
      });
    }
  }
  return out;
}

export function detectAllYogas(d1: Chart): YogaResult[] {
  return [
    ...detectRajYogas(d1),
    ...detectDhanaYogas(d1),
    ...detectGajakesari(d1),
    ...detectPanchaMahapurusha(d1),
  ];
}
