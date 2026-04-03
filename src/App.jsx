import React, { useEffect, useMemo, useState } from "react";
import GeneratorPanel from "./components/GeneratorPanel";
import LearningPanel from "./components/LearningPanel";
import SharingPanel from "./components/SharingPanel";
import {
  AVAILABLE_LANGUAGES,
  DEFAULT_LANGUAGE_SELECTION,
  buildWordPassword,
  loadSelectedWords,
  scorePassword
} from "./utils/passwordGenerator";

export default function App() {
  const [activeTab, setActiveTab] = useState("generator");
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === "undefined") {
      return true;
    }
    return navigator.onLine;
  });
  const [selectedLanguages, setSelectedLanguages] = useState(DEFAULT_LANGUAGE_SELECTION);
  const [wordCount, setWordCount] = useState(4);
  const [minCharsPerWord, setMinCharsPerWord] = useState(1);
  const [maxCharsPerWord, setMaxCharsPerWord] = useState(12);
  const [separator, setSeparator] = useState("-");
  const [capitalizeWords, setCapitalizeWords] = useState(true);
  const [addNumber, setAddNumber] = useState(true);
  const [addSymbol, setAddSymbol] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [generatorMessage, setGeneratorMessage] = useState(
    "Select languages and generate a password from words."
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const [password, setPassword] = useState("");
  const [learnPassword, setLearnPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showLearn, setShowLearn] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const selectedLanguageIds = AVAILABLE_LANGUAGES.filter((language) => selectedLanguages[language.id]).map(
    (language) => language.id
  );

  const selectedLanguageSummary = selectedLanguageIds.length
    ? AVAILABLE_LANGUAGES.filter((language) => selectedLanguageIds.includes(language.id))
        .map((language) => language.label)
        .join(", ")
    : "No languages selected";

  const strength = useMemo(() => scorePassword(password), [password]);

  const matchState = useMemo(() => {
    if (!password && !learnPassword) {
      return { text: "Waiting for input…", className: "text-base-content/60" };
    }

    if (!learnPassword) {
      return { text: "Retype the password in the learning field.", className: "text-warning" };
    }

    if (password === learnPassword) {
      return { text: "Perfect match! You learned it.", className: "text-success" };
    }

    return { text: "Not matching yet — keep trying.", className: "text-error" };
  }, [password, learnPassword]);

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
      const filteredWords = words.filter(
        (word) => word.length >= effectiveMinChars && word.length <= effectiveMaxChars
      );

      if (filteredWords.length === 0) {
        throw new Error(
          `No words found in range ${effectiveMinChars}-${effectiveMaxChars} characters.`
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
      setCopyMessage("");
    } catch (error) {
      setGeneratorMessage(error instanceof Error ? error.message : "Could not generate password.");
    } finally {
      setIsGenerating(false);
    }
  };

  const useGeneratedPassword = () => {
    if (!generatedPassword) {
      setGeneratorMessage("Generate a password first.");
      return;
    }

    setPassword(generatedPassword);
    setLearnPassword("");
    setCopyMessage("");
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

  const copyPassword = async () => {
    if (!password) {
      setCopyMessage("Add a password first to copy it.");
      return;
    }

    try {
      await navigator.clipboard.writeText(password);
      setCopyMessage("Password copied to clipboard.");
    } catch {
      setCopyMessage("Clipboard unavailable in this browser context.");
    }
  };

  const resetLearning = () => {
    setPassword("");
    setLearnPassword("");
    setCopyMessage("");
    setShowPassword(false);
    setShowLearn(false);
  };

  return (
    <main className="min-h-screen px-4 py-10 md:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <div className="text-center">
          <h1 className="mt-2 text-3xl font-bold md:text-4xl text-primary uppercase tracking-[0.2em]">Secure Password</h1>
          <p className="mt-2 text-base-content/70">
            Generate passwords, practice learning them, or split them securely with Shamir's Secret Sharing.
          </p>
        </div>

        <div className={`alert ${isOnline ? "alert-success" : "alert-error"} py-2`}>
          <span>{isOnline ? "Internet status: Online" : "Internet status: Offline"}</span>
        </div>

        <p className="text-sm text-base-content/70">
          For extra privacy, you can disconnect from the internet and continue using this site offline
          to be sure no information leaves your device.
        </p>

        {/* Tab Navigation */}
        <div className="tabs tabs-lifted flex justify-center gap-1 border-b-2 border-base-300/40">
          <button
            className={`tab ${activeTab === "generator" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("generator")}
          >
            Generator & Learning
          </button>
          <button
            className={`tab ${activeTab === "sharing" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("sharing")}
          >
            Secret Sharing
          </button>
        </div>

        {/* Generator Tab */}
        {activeTab === "generator" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <GeneratorPanel
              generatorMessage={generatorMessage}
              generatedPassword={generatedPassword}
              setGeneratedPassword={setGeneratedPassword}
              showGeneratedPassword={showGeneratedPassword}
              setShowGeneratedPassword={setShowGeneratedPassword}
              setGeneratorMessage={setGeneratorMessage}
              wordCount={wordCount}
              setWordCount={setWordCount}
              minCharsPerWord={minCharsPerWord}
              setMinCharsPerWord={setMinCharsPerWord}
              maxCharsPerWord={maxCharsPerWord}
              setMaxCharsPerWord={setMaxCharsPerWord}
              separator={separator}
              setSeparator={setSeparator}
              capitalizeWords={capitalizeWords}
              setCapitalizeWords={setCapitalizeWords}
              addNumber={addNumber}
              setAddNumber={setAddNumber}
              addSymbol={addSymbol}
              setAddSymbol={setAddSymbol}
              selectedLanguages={selectedLanguages}
              toggleLanguage={toggleLanguage}
              selectedLanguageSummary={selectedLanguageSummary}
              isGenerating={isGenerating}
              generatePassword={generatePassword}
              copyGeneratedPassword={copyGeneratedPassword}
              useGeneratedPassword={useGeneratedPassword}
            />

            <LearningPanel
              password={password}
              setPassword={setPassword}
              learnPassword={learnPassword}
              setLearnPassword={setLearnPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showLearn={showLearn}
              setShowLearn={setShowLearn}
              copyMessage={copyMessage}
              setCopyMessage={setCopyMessage}
              matchState={matchState}
              strength={strength}
              copyPassword={copyPassword}
              resetLearning={resetLearning}
            />
          </div>
        )}

        {/* Sharing Tab */}
        {activeTab === "sharing" && (
          <SharingPanel />
        )}
      </div>
    </main>
  );
}
