import React from "react";
import { AVAILABLE_LANGUAGES, SEPARATORS } from "../utils/passwordGenerator";

export default function GeneratorPanel({
  generatorMessage,
  generatedPassword,
  setGeneratedPassword,
  showGeneratedPassword,
  setShowGeneratedPassword,
  setGeneratorMessage,
  wordCount,
  setWordCount,
  minCharsPerWord,
  setMinCharsPerWord,
  maxCharsPerWord,
  setMaxCharsPerWord,
  separator,
  setSeparator,
  capitalizeWords,
  setCapitalizeWords,
  addNumber,
  setAddNumber,
  addSymbol,
  setAddSymbol,
  selectedLanguages,
  toggleLanguage,
  selectedLanguageSummary,
  isGenerating,
  generatePassword,
  copyGeneratedPassword,
  useGeneratedPassword
}) {
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
        </div>

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

        <div className="card-actions mt-3 flex-wrap justify-start">
          <button className="btn btn-primary" type="button" onClick={generatePassword} disabled={isGenerating}>
            {isGenerating ? "Generating…" : "Generate"}
          </button>
          <button className="btn btn-outline" type="button" onClick={copyGeneratedPassword}>
            Copy generated
          </button>
          <button className="btn btn-ghost" type="button" onClick={useGeneratedPassword}>
            Use for learning
          </button>
        </div>
      </div>
    </section>
  );
}
