const WORD_LIST_URLS = import.meta.glob("../../words/*.txt", {
  eager: true,
  import: "default",
  query: "?url"
});

const SYMBOLS = ["!", "@", "#", "$", "%", "&", "*"];
export const SEPARATORS = ["-", "_", ".", "~", ""];

function languageIdFromPath(path) {
  const fileName = path.split("/").pop() ?? "";
  return fileName.replace(/\.txt$/, "");
}

function formatLanguageLabel(id) {
  return `${id.charAt(0).toUpperCase()}${id.slice(1)}`;
}

export const AVAILABLE_LANGUAGES = Object.entries(WORD_LIST_URLS)
  .map(([path, url]) => {
    const id = languageIdFromPath(path);
    return { id, label: formatLanguageLabel(id), url };
  })
  .sort((left, right) => left.label.localeCompare(right.label));

export const DEFAULT_LANGUAGE_SELECTION = Object.fromEntries(
  AVAILABLE_LANGUAGES.map((language) => [language.id, language.id === "english"])
);

const wordListCache = new Map();

function sanitizeWords(rawWords) {
  return rawWords.filter((word) => /^\p{L}{1,}$/u.test(word));
}

function parseWordList(text) {
  return sanitizeWords(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  );
}

async function loadWordList(url) {
  if (wordListCache.has(url)) {
    return wordListCache.get(url);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load word list: ${url}`);
  }

  const words = parseWordList(await response.text());
  wordListCache.set(url, words);
  return words;
}

export async function loadSelectedWords(selectedLanguageIds) {
  const selectedLanguages = AVAILABLE_LANGUAGES.filter((language) =>
    selectedLanguageIds.includes(language.id)
  );

  const loadedLists = await Promise.all(
    selectedLanguages.map(async (language) => ({
      words: await loadWordList(language.url)
    }))
  );

  return [...new Set(loadedLists.flatMap((entry) => entry.words))];
}

function pickRandomWords(words, count) {
  const pickedWords = new Set();
  const targetCount = Math.min(count, words.length);

  while (pickedWords.size < targetCount) {
    const randomIndex = Math.floor(Math.random() * words.length);
    pickedWords.add(words[randomIndex]);
  }

  return [...pickedWords];
}

function capitalizeWord(word) {
  return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
}

export function buildWordPassword({ words, wordCount, separator, capitalizeWords, addNumber, addSymbol }) {
  const selectedWords = pickRandomWords(words, wordCount);
  const formattedWords = selectedWords.map((word) => (capitalizeWords ? capitalizeWord(word) : word));
  const base = formattedWords.join(separator);
  const numberSuffix = addNumber ? `${separator}${Math.floor(10 + Math.random() * 90)}` : "";
  const symbolSuffix = addSymbol ? `${separator}${SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]}` : "";

  return `${base}${numberSuffix}${symbolSuffix}`;
}

export function scorePassword(value) {
  if (!value) {
    return { score: 0, label: "—", colorClass: "progress-error" };
  }

  let score = Math.min(20, value.length * 3);
  if (/[a-z]/.test(value)) score += 15;
  if (/[A-Z]/.test(value)) score += 15;
  if (/\d/.test(value)) score += 15;
  if (/[^A-Za-z0-9]/.test(value)) score += 20;
  if (value.length >= 12) score += 15;
  score = Math.min(score, 100);

  if (score < 40) return { score, label: "Weak", colorClass: "progress-error" };
  if (score < 70) return { score, label: "Medium", colorClass: "progress-warning" };
  return { score, label: "Strong", colorClass: "progress-success" };
}
