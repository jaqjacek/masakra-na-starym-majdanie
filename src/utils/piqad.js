/**
 * Convert Okrand romanized tlhIngan Hol to CSUR pIqaD (U+F8D0–U+F8FF).
 * Placeholders like {count} stay untouched so interpolation can run first.
 */
const PROTECTED = [
  'Wojsławice',
  'wojsławice',
  'Majdanie',
  'MASAKRA',
  'Czesiek',
  'prochno',
  'Izydor',
  'Bardak',
  'Starym',
  'Baron',
  'Buras',
  'Fafik',
  'API',
  'PDF',
  'FAQ',
  'KPI',
  'LTE',
  'ID'
];

const SINGLE = {
  a: '\uF8D0',
  b: '\uF8D1',
  D: '\uF8D3',
  e: '\uF8D4',
  H: '\uF8D6',
  I: '\uF8D7',
  j: '\uF8D8',
  l: '\uF8D9',
  m: '\uF8DA',
  n: '\uF8DB',
  o: '\uF8DD',
  p: '\uF8DE',
  q: '\uF8DF',
  Q: '\uF8E0',
  r: '\uF8E1',
  S: '\uF8E2',
  t: '\uF8E3',
  u: '\uF8E5',
  v: '\uF8E6',
  w: '\uF8E7',
  y: '\uF8E8',
  "'": '\uF8E9',
  0: '\uF8F0',
  1: '\uF8F1',
  2: '\uF8F2',
  3: '\uF8F3',
  4: '\uF8F4',
  5: '\uF8F5',
  6: '\uF8F6',
  7: '\uF8F7',
  8: '\uF8F8',
  9: '\uF8F9',
  ',': '\uF8FD',
  '.': '\uF8FE'
};

export const toPiqad = (text) => {
  if (!text || typeof text !== 'string') return text;
  let out = '';
  for (let i = 0; i < text.length; ) {
    if (text[i] === '{') {
      const end = text.indexOf('}', i);
      if (end !== -1) {
        out += text.slice(i, end + 1);
        i = end + 1;
        continue;
      }
    }
    const protectedToken = PROTECTED.find((token) => text.startsWith(token, i));
    if (protectedToken) {
      out += protectedToken;
      i += protectedToken.length;
      continue;
    }
    if (text.startsWith('tlh', i)) {
      out += '\uF8E4';
      i += 3;
      continue;
    }
    if (text.startsWith('ch', i)) {
      out += '\uF8D2';
      i += 2;
      continue;
    }
    if (text.startsWith('gh', i)) {
      out += '\uF8D5';
      i += 2;
      continue;
    }
    if (text.startsWith('ng', i)) {
      out += '\uF8DC';
      i += 2;
      continue;
    }
    out += SINGLE[text[i]] ?? text[i];
    i += 1;
  }
  return out;
};
