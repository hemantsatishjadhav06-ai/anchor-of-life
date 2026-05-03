import './_env';
import { computeFullChart } from '../src/lib/astrology/compute';
import { buildPrescription } from '../src/lib/astrology/prescription';

// Mahatma Gandhi: 2 Oct 1869, 07:11 local, Porbandar (21.6422, 69.6093). IST = +5:30.
const gandhi = computeFullChart({
  date: '1869-10-02',
  time: '07:11',
  tzOffsetMinutes: 330,
  lat: 21.6422,
  lon: 69.6093,
  placeName: 'Porbandar, IN',
  name: 'Mahatma Gandhi',
});

console.log('=== Mahatma Gandhi ===');
console.log('UTC of birth:', gandhi.utcDate);
console.log('Ayanamsa:', gandhi.ayanamsa.toFixed(3), 'degrees');
console.log('Lagna:', gandhi.d1.ascSign, `(${gandhi.d1.ascDegreeInSign.toFixed(2)}°)`);
console.log('  Expected: Libra ascendant (~7°)');
console.log();
console.log('Planets:');
for (const p of gandhi.d1.planets) {
  console.log(`  ${p.name.padEnd(8)} ${p.sign.padEnd(12)} ${p.degreeInSign.toFixed(2).padStart(6)}°  H${p.house.toString().padStart(2)} ${p.nakshatra} (lord ${p.nakshatraLord})${p.retrograde ? ' R' : ''}`);
}
console.log();
const presc = buildPrescription(gandhi);
console.log('Doshas:', presc.doshas.join(', ') || 'none');
console.log('Summary:', presc.summary);
console.log();
console.log('20-field prescription:');
for (const [k, v] of Object.entries(presc.fields)) {
  const tag = v.intensity === 'mandatory' ? '★' : v.intensity === 'avoid' ? '✗' : v.intensity === 'recommended' ? '·' : ' ';
  console.log(`  ${tag} ${k.padEnd(28)} ${v.value}`);
}
