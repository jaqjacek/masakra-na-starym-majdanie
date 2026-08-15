export const DEFAULT_LANGUAGE = 'pl';

export const WORLD_LANGUAGES = [
  { code: 'pl', flag: '🇵🇱', name: 'Polski', englishName: 'Polish' },
  { code: 'en', flag: '🇬🇧', name: 'English', englishName: 'English' },
  { code: 'cs', flag: '🇨🇿', name: 'Čeština', englishName: 'Czech' },
  { code: 'uk', flag: '🇺🇦', name: 'Українська', englishName: 'Ukrainian' },
  { code: 'tlh', flag: '🛸', name: 'tlhIngan Hol', englishName: 'Klingon' }
];

export const SUPPORTED_LANGUAGE_CODES = WORLD_LANGUAGES.map((item) => item.code);

export const resolveLanguage = (code) => (
  SUPPORTED_LANGUAGE_CODES.includes(code) ? code : DEFAULT_LANGUAGE
);
