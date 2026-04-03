import React, { useMemo, useState } from "react";

function scorePassword(value) {
  if (!value) {
    return { score: 0, label: "—", colorClass: "bad" };
  }

  let score = Math.min(20, value.length * 3);
  if (/[a-z]/.test(value)) score += 15;
  if (/[A-Z]/.test(value)) score += 15;
  if (/\d/.test(value)) score += 15;
  if (/[^A-Za-z0-9]/.test(value)) score += 20;
  if (value.length >= 12) score += 15;
  score = Math.min(score, 100);

  if (score < 40) return { score, label: "Weak", colorClass: "bad" };
  if (score < 70) return { score, label: "Medium", colorClass: "warn" };
  return { score, label: "Strong", colorClass: "good" };
}

export default function App() {
  const [password, setPassword] = useState("");
  const [learnPassword, setLearnPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showLearn, setShowLearn] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  const strength = useMemo(() => scorePassword(password), [password]);

  const matchState = useMemo(() => {
    if (!password && !learnPassword) {
      return { text: "Waiting for input…", className: "" };
    }

    if (!learnPassword) {
      return {
        text: "Retype the password in the learning field.",
        className: "warn"
      };
    }

    if (password === learnPassword) {
      return { text: "Perfect match! You learned it.", className: "ok" };
    }

    return { text: "Not matching yet — keep trying.", className: "bad" };
  }, [password, learnPassword]);

  const message = copyMessage || matchState.text;
  const messageClass = copyMessage ? "ok" : matchState.className;

  const resetForm = () => {
    setPassword("");
    setLearnPassword("");
    setShowPassword(false);
    setShowLearn(false);
    setCopyMessage("");
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

    window.setTimeout(() => setCopyMessage(""), 1800);
  };

  return (
    <main className="app">
      <section className="card" aria-labelledby="title">
        <p className="eyebrow">Secure Practice</p>
        <h1 id="title">Password Learning Studio</h1>
        <p className="subtitle">
          Type your password once, then retype it in the learning field until both
          values match perfectly.
        </p>

        <form
          onSubmit={(event) => event.preventDefault()}
          onReset={resetForm}
          noValidate
        >
          <div className="field-group">
            <label htmlFor="passwordInput">Enter password</label>
            <div className="input-wrap">
              <input
                id="passwordInput"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Enter password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setCopyMessage("");
                }}
                aria-describedby="strengthText"
                required
              />
              <button
                type="button"
                className="ghost"
                onClick={() => setShowPassword((state) => !state)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="strength-row" aria-live="polite">
              <div
                className="strength-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={strength.score}
              >
                <span
                  className={`strength-bar ${strength.colorClass}`}
                  style={{ width: `${strength.score}%` }}
                />
              </div>
              <span id="strengthText">Strength: {strength.label}</span>
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="learnInput">Learn password (retype)</label>
            <div className="input-wrap">
              <input
                id="learnInput"
                type={showLearn ? "text" : "password"}
                autoComplete="off"
                placeholder="Retype password to learn it"
                value={learnPassword}
                onChange={(event) => {
                  setLearnPassword(event.target.value);
                  setCopyMessage("");
                }}
                aria-describedby="matchText"
                required
              />
              <button
                type="button"
                className="ghost"
                onClick={() => setShowLearn((state) => !state)}
              >
                {showLearn ? "Hide" : "Show"}
              </button>
            </div>
            <p id="matchText" className={`hint ${messageClass}`} aria-live="polite">
              {message}
            </p>
          </div>

          <div className="actions">
            <button type="button" onClick={copyPassword} className="btn secondary">
              Copy password
            </button>
            <button type="reset" className="btn primary">
              Reset
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
