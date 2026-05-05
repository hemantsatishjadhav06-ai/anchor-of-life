// V1 conservative dosha detectors.
import type { Chart, DoshaResult } from './types';
import { getEclipticLongitude, getAyanamsa } from './compute';

export function detectMangal(d1: Chart): DoshaResult {
  const mars = d1.planets.find(p => p.name === 'Mars')!;
  const houses = [1, 4, 7, 8, 12];
  const present = houses.includes(mars.house);
  return {
    key: 'mangal',
    present,
    detail: present
      ? `Mars in house ${mars.house}`
      : 'Mars not in 1/4/7/8/12',
  };
}

export function detectKaalSarp(d1: Chart): DoshaResult {
  const rahu = d1.planets.find(p => p.name === 'Rahu')!.longitude;
  const ketu = (rahu + 180) % 360;
  function arcContains(start: number, end: number, lon: number): boolean {
    const a = ((lon - start) % 360 + 360) % 360;
    const b = ((end - start) % 360 + 360) % 360;
    return a < b;
  }
  const nonNodes = d1.planets.filter(p => p.name !== 'Rahu' && p.name !== 'Ketu');
  const sideA = nonNodes.filter(p => arcContains(rahu, ketu, p.longitude)).length;
  const sideB = nonNodes.length - sideA;
  const present = sideA === 0 || sideB === 0;
  return {
    key: 'kaalSarp',
    present,
    detail: present
      ? 'All seven planets between Rahu and Ketu on one side'
      : 'Planets on both sides of Rahu–Ketu axis',
  };
}

export function detectPitra(d1: Chart): DoshaResult {
  const planets = d1.planets;
  const sun = planets.find(p => p.name === 'Sun')!;
  const moon = planets.find(p => p.name === 'Moon')!;
  const rahu = planets.find(p => p.name === 'Rahu')!;
  const ketu = planets.find(p => p.name === 'Ketu')!;
  const sunWith = sun.signIndex === rahu.signIndex || sun.signIndex === ketu.signIndex;
  const moonWith = moon.signIndex === rahu.signIndex || moon.signIndex === ketu.signIndex;
  const malefic9 = planets.some(
    p => ['Saturn','Mars','Rahu','Ketu'].includes(p.name) && p.house === 9,
  );
  const present = sunWith || moonWith || malefic9;
  const reasons = [
    sunWith && 'Sun conjunct Rahu/Ketu',
    moonWith && 'Moon conjunct Rahu/Ketu',
    malefic9 && 'Malefic in 9th house',
  ].filter(Boolean).join('; ');
  return {
    key: 'pitra',
    present,
    detail: reasons || 'No Pitra Dosh markers',
  };
}

export function detectSadeSati(d1: Chart, now: Date = new Date()): DoshaResult {
  const moonSignIdx = d1.planets.find(p => p.name === 'Moon')!.signIndex;
  const satRaw = getEclipticLongitude('Saturn', now);
  const ayan = getAyanamsa(now);
  const satSid = ((satRaw - ayan) % 360 + 360) % 360;
  const satSignIdx = Math.floor(satSid / 30);
  const diff = (satSignIdx - moonSignIdx + 12) % 12;
  const present = diff === 11 || diff === 0 || diff === 1;
  const which = diff === 11 ? '12th' : diff === 0 ? '1st' : diff === 1 ? '2nd' : null;
  return {
    key: 'sadeSati',
    present,
    detail: present
      ? `Saturn currently in ${which} sign from natal Moon (Sade Sati phase)`
      : 'Saturn not in 12/1/2 from natal Moon',
  };
}

export function detectAllDoshas(d1: Chart, now: Date = new Date()): DoshaResult[] {
  return [detectMangal(d1), detectKaalSarp(d1), detectPitra(d1), detectSadeSati(d1, now)];
}
