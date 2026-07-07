/**
 * Transliteration utilities using Google Input Tools API.
 * Supports all major Indian languages.
 */

export const INDIAN_LANGUAGES = [
  { code: 'te-t-i0-und', label: 'Telugu',    native: 'తెలుగు',   short: 'తె', flag: '🇮🇳' },
  { code: 'hi-t-i0-und', label: 'Hindi',     native: 'हिंदी',    short: 'हि', flag: '🇮🇳' },
  { code: 'ta-t-i0-und', label: 'Tamil',     native: 'தமிழ்',    short: 'த', flag: '🇮🇳' },
  { code: 'kn-t-i0-und', label: 'Kannada',   native: 'ಕನ್ನಡ',    short: 'ಕ',  flag: '🇮🇳' },
  { code: 'ml-t-i0-und', label: 'Malayalam', native: 'മലയാളം',  short: 'മ',  flag: '🇮🇳' },
  { code: 'bn-t-i0-und', label: 'Bengali',   native: 'বাংলা',    short: 'ব',  flag: '🇮🇳' },
  { code: 'gu-t-i0-und', label: 'Gujarati',  native: 'ગુજરાતી',  short: 'ગ',  flag: '🇮🇳' },
  { code: 'mr-t-i0-und', label: 'Marathi',   native: 'मराठी',    short: 'म',  flag: '🇮🇳' },
  { code: 'pa-t-i0-und', label: 'Punjabi',   native: 'ਪੰਜਾਬੀ',  short: 'ਪ',  flag: '🇮🇳' },
  { code: 'or-t-i0-und', label: 'Odia',      native: 'ଓଡ଼ିଆ',    short: 'ଓ',  flag: '🇮🇳' },
  { code: 'ur-t-i0-und', label: 'Urdu',      native: 'اردو',     short: 'اُ', flag: '🇮🇳' },
]

/**
 * Transliterate a single English word to the target Indian language using
 * Google Input Tools API.
 * @param {string} word - English roman text
 * @param {string} langCode - Google Input Tools language code (e.g. 'te-t-i0-und')
 * @returns {Promise<string>} - Transliterated text or original word if failed
 */
export async function transliterateWord(word, langCode) {
  if (!word || !langCode) return word
  // Only transliterate purely English (ASCII letter) words
  if (!/^[a-zA-Z]+$/.test(word)) return word
  try {
    // Route through backend proxy to avoid CORS restrictions on localhost
    const url = `/api/v1/transliterate?text=${encodeURIComponent(word)}&itc=${encodeURIComponent(langCode)}`
    const res = await fetch(url)
    if (!res.ok) return word
    const data = await res.json()
    // Response shape: ["SUCCESS", [["word", ["transliterated", ...], "", {}]]]
    if (
      Array.isArray(data) &&
      data[0] === 'SUCCESS' &&
      data[1]?.[0]?.[1]?.[0]
    ) {
      return data[1][0][1][0]
    }
  } catch {
    // Network error – return original
  }
  return word
}
