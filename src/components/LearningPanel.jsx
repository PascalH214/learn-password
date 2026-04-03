import React, { useMemo, useState } from "react";
import { scorePassword } from "../utils/passwordGenerator";

export default function LearningPanel({
  password,
  setPassword,
  useLearningForEncryption
}) {
  const [learnPassword, setLearnPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showLearn, setShowLearn] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

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
    <section className="card border border-base-300/40 bg-base-200/70 shadow-2xl backdrop-blur">
      <div className="card-body">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="card-title">Learning</h2>
          <span className="badge badge-secondary badge-outline">Practice</span>
        </div>

        <label className="form-control">
          <span className="label-text mb-1">Enter password</span>
          <div className="join">
            <input
              className="input input-bordered join-item w-full"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setCopyMessage("");
              }}
              placeholder="Enter password"
            />
            <button
              className="btn btn-outline join-item"
              type="button"
              onClick={() => setShowPassword((state) => !state)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span>Strength</span>
            <span className="font-semibold">{strength.label}</span>
          </div>
          <progress className={`progress w-full ${strength.colorClass}`} value={strength.score} max="100" />
        </div>

        <label className="form-control mt-4">
          <span className="label-text mb-1">Learn password (retype)</span>
          <div className="join">
            <input
              className="input input-bordered join-item w-full"
              type={showLearn ? "text" : "password"}
              value={learnPassword}
              onChange={(event) => {
                setLearnPassword(event.target.value);
                setCopyMessage("");
              }}
              placeholder="Retype password"
            />
            <button
              className="btn btn-outline join-item"
              type="button"
              onClick={() => setShowLearn((state) => !state)}
            >
              {showLearn ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <div className="alert mt-4 bg-base-100">
          <span className={copyMessage ? "text-success" : matchState.className}>
            {copyMessage || matchState.text}
          </span>
        </div>

        <div className="card-actions mt-3 flex-wrap justify-start">
          <button className="btn btn-outline" type="button" onClick={copyPassword}>
            Copy password
          </button>
          <button className="btn btn-secondary" type="button" onClick={resetLearning}>
            Reset learning
          </button>
        </div>
      </div>
    </section>
  );
}
