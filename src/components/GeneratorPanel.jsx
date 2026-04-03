import React, { useMemo, useState } from "react";
import {
  AVAILABLE_LANGUAGES,
  DEFAULT_LANGUAGE_SELECTION,
  SEPARATORS,
  buildWordPassword,
  loadSelectedWords
} from "../utils/passwordGenerator";

export default function GeneratorPanel({
  onUseForLearning,
  onUseForEncryption,
  onUseForSecretSharing
}) {
  const [selectedLanguages, setSelectedLanguages] = useState(DEFAULT_LANGUAGE_SELECTION);
  const [wordCount, setWordCount] = useState(4);
  const [minCharsPerWord, setMinCharsPerWord] = useState(1);
  const [maxCharsPerWord, setMaxCharsPerWord] = useState(12);
  const [separator, setSeparator] = useState("-");
  const [capitalizeWords, setCapitalizeWords] = useState(true);
  const [addNumber, setAddNumber] = useState(true);
  const [addSymbol, setAddSymbol] = useState(true);
  const [excludeSpecialCharacters, setExcludeSpecialCharacters] = useState(false);
  const [excludedCharacters, setExcludedCharacters] = useState("äöü");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [generatorMessage, setGeneratorMessage] = useState(
    "Select languages and generate a password from words."
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedLanguageIds = useMemo(
    () =>
      AVAILABLE_LANGUAGES.filter((language) => selectedLanguages[language.id]).map(
        (language) => language.id
      ),
    [selectedLanguages]
  );

  const selectedLanguageSummary = selectedLanguageIds.length
    ? AVAILABLE_LANGUAGES.filter((language) => selectedLanguageIds.includes(language.id))
        .map((language) => language.label)
        .join(", ")
    : "No languages selected";

  const toggleLanguage = (languageId) => {
    setSelectedLanguages((current) => ({
      ...current,
      [languageId]: !current[languageId]
    }));
  };

  const generatePassword = async () => {
    if (selectedLanguageIds.length === 0) {
      setGeneratorMessage("Choose at least one language first.");
      return;
    }

    setIsGenerating(true);
    setGeneratorMessage("Loading selected word lists…");

    try {
      const words = await loadSelectedWords(selectedLanguageIds);
      const effectiveMinChars = Math.min(minCharsPerWord, maxCharsPerWord);
      const effectiveMaxChars = Math.max(minCharsPerWord, maxCharsPerWord);
      const excludedSet = new Set(excludedCharacters.trim().split(""));
      const filteredWords = words.filter((word) => {
        const withinLength = word.length >= effectiveMinChars && word.length <= effectiveMaxChars;
        if (!withinLength) {
          return false;
        }

        if (!excludeSpecialCharacters || excludedSet.size === 0) {
          return true;
        }

        return ![...word].some((char) => excludedSet.has(char));
      });

      if (filteredWords.length === 0) {
        const exclusionHint = excludeSpecialCharacters && excludedCharacters.trim().length > 0
          ? ` while excluding: ${excludedCharacters}`
          : "";
        throw new Error(
          `No words found in range ${effectiveMinChars}-${effectiveMaxChars} characters${exclusionHint}.`
        );
      }

      const nextPassword = buildWordPassword({
        words: filteredWords,
        wordCount,
        separator,
        capitalizeWords,
        addNumber,
        addSymbol
      });

      setGeneratedPassword(nextPassword);
      setGeneratorMessage(`Generated from ${selectedLanguageSummary}.`);
    } catch (error) {
      setGeneratorMessage(error instanceof Error ? error.message : "Could not generate password.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyGeneratedPassword = async () => {
    if (!generatedPassword) {
      setGeneratorMessage("Generate a password first.");
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedPassword);
      setGeneratorMessage("Generated password copied to clipboard.");
    } catch {
      setGeneratorMessage("Clipboard unavailable in this browser context.");
    }
  };

  const useGeneratedPassword = () => {
    if (!generatedPassword) {
      setGeneratorMessage("Generate a password first.");
      return;
    }

    onUseForLearning(generatedPassword);
  };

  const useGeneratedForEncryption = () => {
    if (!generatedPassword) {
      setGeneratorMessage("Generate a password first.");
      return;
    }

    onUseForEncryption(generatedPassword);
  };

  const useGeneratedForSecretSharing = () => {
    if (!generatedPassword) {
      setGeneratorMessage("Generate a password first.");
      return;
    }

    onUseForSecretSharing(generatedPassword);
  };
  return (
    <section className="card border border-base-300/40 bg-base-200/70 shadow-2xl backdrop-blur">
      <div className="card-body">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="card-title">Password Generator</h2>
          <span className="badge badge-primary badge-outline">Generation</span>
        </div>

        <div className="alert alert-info py-2 text-sm">
          <span>{generatorMessage}</span>
        </div>

        <label className="form-control mt-2">
          <span className="label-text mb-1">Generated password</span>
          <div className="join">
            <input
              className="input input-bordered join-item w-full font-semibold"
              type={showGeneratedPassword ? "text" : "password"}
              value={generatedPassword}
              onChange={(event) => {
                setGeneratedPassword(event.target.value);
                setGeneratorMessage("Manual edit applied to generated password.");
              }}
              placeholder="Generate a password to see it here"
            />
            <button
              className="btn btn-outline join-item"
              type="button"
              onClick={() => setShowGeneratedPassword((state) => !state)}
            >
              {showGeneratedPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="form-control">
            <span className="label-text mb-1">Words</span>
            <select
              className="select select-bordered"
              value={wordCount}
              onChange={(event) => setWordCount(Number(event.target.value))}
            >
              {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control">
            <span className="label-text mb-1">Min chars / word</span>
            <input
              className="input input-bordered"
              type="number"
              min={1}
              max={32}
              value={minCharsPerWord}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value) && value >= 1) {
                  setMinCharsPerWord(value);
                }
              }}
            />
          </label>

          <label className="form-control">
            <span className="label-text mb-1">Separator</span>
            <select
              className="select select-bordered"
              value={separator}
              onChange={(event) => setSeparator(event.target.value)}
            >
              {SEPARATORS.map((item) => (
                <option key={item || "none"} value={item}>
                  {item === "" ? "None" : item}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control">
            <span className="label-text mb-1">Max chars / word</span>
            <input
              className="input input-bordered"
              type="number"
              min={1}
              max={32}
              value={maxCharsPerWord}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value) && value >= 1) {
                  setMaxCharsPerWord(value);
                }
              }}
            />
          </label>

        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="label cursor-pointer justify-start gap-2 rounded-lg border border-base-300 px-3 py-2">
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm"
              checked={capitalizeWords}
              onChange={(event) => setCapitalizeWords(event.target.checked)}
            />
            <span className="label-text">Capitalize words</span>
          </label>
          <label className="label cursor-pointer justify-start gap-2 rounded-lg border border-base-300 px-3 py-2">
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm"
              checked={addNumber}
              onChange={(event) => setAddNumber(event.target.checked)}
            />
            <span className="label-text">Add number suffix</span>
          </label>
          <label className="label cursor-pointer justify-start gap-2 rounded-lg border border-base-300 px-3 py-2 sm:col-span-2">
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm"
              checked={addSymbol}
              onChange={(event) => setAddSymbol(event.target.checked)}
            />
            <span className="label-text">Add symbol suffix</span>
          </label>
          <label className="label cursor-pointer justify-start gap-2 rounded-lg border border-base-300 px-3 py-2 sm:col-span-2">
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm"
              checked={excludeSpecialCharacters}
              onChange={(event) => setExcludeSpecialCharacters(event.target.checked)}
            />
            <span className="label-text">Exclude specific characters</span>
          </label>
        </div>

        <label className="form-control mt-2">
          <span className="label-text mb-1">Characters to exclude (example: äöü)</span>
          <input
            className="input input-bordered"
            type="text"
            value={excludedCharacters}
            onChange={(event) => setExcludedCharacters(event.target.value)}
            placeholder="äöü"
            disabled={!excludeSpecialCharacters}
          />
        </label>

        <div className="divider my-2">Languages</div>

        <div className="grid gap-2 sm:grid-cols-2">
          {AVAILABLE_LANGUAGES.map((language) => (
            <label
              key={language.id}
              className="label cursor-pointer justify-start gap-2 rounded-lg border border-base-300 px-3 py-2"
            >
              <input
                type="checkbox"
                className="checkbox checkbox-accent checkbox-sm"
                checked={Boolean(selectedLanguages[language.id])}
                onChange={() => toggleLanguage(language.id)}
              />
              <span className="label-text">{language.label}</span>
            </label>
          ))}
        </div>

        <p className="mt-2 text-sm text-base-content/70">Selected: {selectedLanguageSummary}</p>

        <div className="card-actions mt-3 justify-start gap-2">
          <button className="btn btn-primary" type="button" onClick={generatePassword} disabled={isGenerating}>
            {isGenerating ? "Generating…" : "Generate"}
          </button>
          <button className="btn btn-outline" type="button" onClick={copyGeneratedPassword}>
            Copy generated
          </button>
        </div>

        <div className="mt-2 flex flex-nowrap items-center gap-2 overflow-x-auto">
          <button className="btn btn-ghost btn-sm" type="button" onClick={useGeneratedPassword}>
            Use for learning
          </button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={useGeneratedForSecretSharing}>
            Use for secret sharing
          </button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={useGeneratedForEncryption}>
            Use for encryption
          </button>
        </div>
      </div>
    </section>
  );
}
