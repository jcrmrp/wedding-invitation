
const dictionary: Record<string, { en: string; tl: string }> = {
  'request_the_honour': { en: 'request the honour of your presence', tl: 'nagpapa-alam ng aming pagdiriwang' },
  'the_celebration': { en: 'The Celebration', tl: 'Ang Pagdiriwang' },
  'our_journey': { en: 'Our Journey', tl: 'Ang Aming Kuwento' },
  'gallery': { en: 'Gallery', tl: 'Galeriya' },
  'entrance': { en: 'Entrance', tl: 'Pasok' },
  'dress_code': { en: 'Dress Code', tl: 'Dres Code' },
  'gift_of_love': { en: 'Gift of Love', tl: 'Regalo ng Pagmamahal' },
  'rsvp': { en: 'RSVP', tl: 'Magsagot' },
  'thank_you': { en: 'Thank You!', tl: 'Salamat!' },
  'well_miss_you': { en: "We'll Miss You", tl: 'Mamimiss Ka Namin' },
  'confirmed': { en: 'Confirmed', tl: 'Kumpirmado' },
  'declined': { en: 'Declined', tl: 'Hindi Puwede' },
  'attending': { en: 'Will you be attending?', tl: 'Darating ka ba?' },
  'meal_choice': { en: 'Meal Choice', tl: 'Pagpipilian ng Pagkain' },
  'plus_one': { en: 'Bringing a plus one?', tl: 'Dadalhin mo ba ang plus one?' },
  'submit': { en: 'Submit RSVP', tl: 'Ipadala ang Sagot' },
  'loading': { en: 'Loading invitation…', tl: 'Naglo-load…' },
  'rsvp_closed': { en: 'RSVP Closed', tl: 'Isara ang RSVP' },
  'not_found': { en: 'Invitation Not Found', tl: 'Hindi Nahanap' },
};

type Lang = 'en' | 'tl';

let currentLang: Lang | null = null;

export function t(key: string, fallback?: string): string {
  const entry = dictionary[key];
  if (!entry) return fallback || key;
  const lang = currentLang || 'en';
  return entry[lang] || entry.en || fallback || key;
}

export function setLanguage(lang: Lang) {
  currentLang = lang;
}

export function getLanguage(): Lang {
  return currentLang || 'en';
}

export { type Lang };


