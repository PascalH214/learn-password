import React, { useState } from "react";
import { splitPassword, combineShares, isValidShare } from "../utils/shamir";
import { exportSharesPdf } from "../utils/sharePdf";

export default function SharingPanel() {
  // Split mode state
  const [splitInput, setSplitInput] = useState("");
  const [totalShares, setTotalShares] = useState(5);
  const [threshold, setThreshold] = useState(3);
  const [splitResult, setSplitResult] = useState(null);
  const [splitError, setSplitError] = useState("");
  const [splitMessage, setSplitMessage] = useState("Enter a password to split into shares.");
  const [showSplitInput, setShowSplitInput] = useState(false);
  const [showSplitShares, setShowSplitShares] = useState({});
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [includePdfMeta, setIncludePdfMeta] = useState(false);
  const [pdfBlockTitle, setPdfBlockTitle] = useState("");

  // Combine mode state
  const [combineInputCount, setCombineInputCount] = useState(3);
  const [shareInputs, setShareInputs] = useState(Array(3).fill(""));
  const [combinedPassword, setCombinedPassword] = useState("");
  const [combineError, setCombineError] = useState("");
  const [combineMessage, setCombineMessage] = useState("Paste shares to reconstruct the password.");
  const [showCombineShares, setShowCombineShares] = useState({});
  const [showCombinedPassword, setShowCombinedPassword] = useState(false);

  // Copy to clipboard with feedback
  const copyToClipboard = (text, feedbackSetter) => {
    navigator.clipboard.writeText(text);
    feedbackSetter("Copied to clipboard!");
    setTimeout(() => feedbackSetter(""), 2000);
  };

  // Handle splitting password
  const handleSplitPassword = () => {
    setSplitError("");
    setSplitMessage("");

    if (!splitInput.trim()) {
      setSplitError("Please enter a password to split.");
      return;
    }

    try {
      const result = splitPassword(splitInput, totalShares, threshold);
      if (result.success) {
        setSplitResult(result);
        setSplitMessage(`Successfully split into ${totalShares} shares. You need ${threshold} to reconstruct.`);
      } else {
        setSplitError(result.error || "Failed to split password");
      }
    } catch (error) {
      setSplitError(error.message);
    }
  };

  // Handle share input change
  const handleShareChange = (index, value) => {
    const newShares = [...shareInputs];
    newShares[index] = value;
    setShareInputs(newShares);
  };

  const handleCombineInputCountChange = (value) => {
    if (!Number.isFinite(value) || value < 2 || value > 32) {
      return;
    }

    setCombineInputCount(value);
    setShareInputs((current) => {
      if (value > current.length) {
        return [...current, ...Array(value - current.length).fill("")];
      }
      return current.slice(0, value);
    });

    setShowCombineShares((current) => {
      const next = {};
      for (let index = 0; index < value; index += 1) {
        if (current[index]) {
          next[index] = true;
        }
      }
      return next;
    });
  };

  // Handle combining shares
  const handleCombineShares = () => {
    setCombineError("");
    setCombineMessage("");

    const validShares = shareInputs.filter((share) => share.trim().length > 0);

    if (validShares.length === 0) {
      setCombineError("Please paste at least one share.");
      return;
    }

    const invalidShares = validShares.filter((share) => !isValidShare(share));
    if (invalidShares.length > 0) {
      setCombineError(`Found ${invalidShares.length} invalid share(s). Shares must be valid hexadecimal.`);
      return;
    }

    const result = combineShares(validShares);
    if (result.success) {
      setCombinedPassword(result.password);
      setCombineMessage("Successfully reconstructed password!");
    } else {
      setCombineError(result.error || "Failed to combine shares");
    }
  };

  // Reset split mode
  const handleResetSplit = () => {
    setSplitInput("");
    setSplitResult(null);
    setSplitError("");
    setSplitMessage("Enter a password to split into shares.");
  };

  const handleExportSharesPdf = async () => {
    if (!splitResult?.shares?.length) {
      setSplitError("Generate shares first, then export the PDF.");
      return;
    }

    setSplitError("");
    setIsExportingPdf(true);

    try {
      await exportSharesPdf({
        shares: splitResult.shares,
        threshold: splitResult.threshold,
        totalShares: splitResult.totalShares,
        includeMeta: includePdfMeta,
        blockTitle: pdfBlockTitle,
      });
      setSplitMessage("PDF exported successfully.");
    } catch (error) {
      setSplitError(error instanceof Error ? error.message : "Failed to export PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Reset combine mode
  const handleResetCombine = () => {
    setShareInputs(Array(combineInputCount).fill(""));
    setShowCombineShares({});
    setShowCombinedPassword(false);
    setCombinedPassword("");
    setCombineError("");
    setCombineMessage("Paste shares to reconstruct the password.");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="card border border-base-300/40 bg-base-200/70 shadow-2xl backdrop-blur">
        <div className="card-body space-y-3">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h2 className="card-title">Split Password</h2>
            <span className="badge badge-success badge-outline">Split</span>
          </div>
            <div
              className={`alert ${splitError ? "alert-error" : splitMessage ? "alert-info" : ""} py-2 text-sm`}
            >
              <span>{splitError || splitMessage}</span>
            </div>

            <label className="form-control">
              <span className="label-text mb-1">Password to split</span>
              <div className="join">
                <input
                  className="input input-bordered join-item w-full"
                  type={showSplitInput ? "text" : "password"}
                  value={splitInput}
                  onChange={(event) => setSplitInput(event.target.value)}
                  placeholder="Enter a password or passphrase"
                />
                <button
                  className="btn btn-outline join-item"
                  type="button"
                  onClick={() => setShowSplitInput((state) => !state)}
                >
                  {showSplitInput ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="form-control">
                <span className="label-text mb-1">Total shares</span>
                <input
                  className="input input-bordered"
                  type="number"
                  min={2}
                  max={32}
                  value={totalShares}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isFinite(value) && value >= 2 && value <= 32) {
                      setTotalShares(value);
                      if (threshold > value) {
                        setThreshold(value);
                      }
                    }
                  }}
                />
              </label>

              <label className="form-control">
                <span className="label-text mb-1">Threshold (min to reconstruct)</span>
                <input
                  className="input input-bordered"
                  type="number"
                  min={2}
                  max={totalShares}
                  value={threshold}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isFinite(value) && value >= 2 && value <= totalShares) {
                      setThreshold(value);
                    }
                  }}
                />
              </label>
            </div>

            <div className="card-actions flex-wrap justify-start gap-2">
              <button className="btn btn-primary" onClick={handleSplitPassword}>
                Split Password
              </button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={handleExportSharesPdf}
                disabled={!splitResult || isExportingPdf}
              >
                {isExportingPdf ? "Exporting PDF…" : "Export PDF"}
              </button>
              <button className="btn btn-ghost" onClick={handleResetSplit}>
                Reset
              </button>
            </div>

            <label className="label cursor-pointer justify-start gap-2 rounded-lg border border-base-300 px-3 py-2">
              <input
                type="checkbox"
                className="checkbox checkbox-primary checkbox-sm"
                checked={includePdfMeta}
                onChange={(event) => setIncludePdfMeta(event.target.checked)}
              />
              <span className="label-text">Include total and threshold in PDF blocks</span>
            </label>

            <label className="form-control">
              <span className="label-text mb-1">Block title (optional)</span>
              <input
                className="input input-bordered"
                type="text"
                value={pdfBlockTitle}
                onChange={(event) => setPdfBlockTitle(event.target.value)}
                placeholder="Example: Name, Birthday, Recovery Set A"
              />
            </label>

          {splitResult && (
              <div className="space-y-2">
                <div className="divider my-2">Generated Shares</div>
                <div className="space-y-2">
                  {splitResult.shares.map((share, index) => (
                    <div key={index} className="join w-full">
                      <input
                        className="input input-bordered join-item w-full font-mono text-xs"
                        type={showSplitShares[index] ? "text" : "password"}
                        value={share}
                        readOnly
                      />
                      <button
                        className="btn btn-outline join-item"
                        type="button"
                        onClick={() => setShowSplitShares((state) => ({ ...state, [index]: !state[index] }))}
                      >
                        {showSplitShares[index] ? "Hide" : "Show"}
                      </button>
                      <button
                        className="btn btn-outline join-item"
                        type="button"
                        onClick={() => copyToClipboard(share, setSplitMessage)}
                      >
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-base-content/70">
                  💡 Store these shares securely in different locations. Any {threshold} of {totalShares} shares can
                  reconstruct the password.
                </p>
              </div>
            )}
        </div>
      </section>

      <section className="card border border-base-300/40 bg-base-200/70 shadow-2xl backdrop-blur">
        <div className="card-body space-y-3">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h2 className="card-title">Combine Shares</h2>
            <span className="badge badge-success badge-outline">Combine</span>
          </div>
            <div
              className={`alert ${combineError ? "alert-error" : combineMessage ? "alert-info" : ""} py-2 text-sm`}
            >
              <span>{combineError || combineMessage}</span>
            </div>

            <label className="form-control max-w-xs">
              <span className="label-text mb-1">Combine input count</span>
              <input
                className="input input-bordered"
                type="number"
                min={2}
                max={32}
                value={combineInputCount}
                onChange={(event) => handleCombineInputCountChange(Number(event.target.value))}
              />
            </label>

            <div className="space-y-2">
              <label className="label-text mb-2 block">Paste your shares (paste at least threshold shares)</label>
              {shareInputs.map((share, index) => (
                <div key={index} className="form-control">
                  <span className="label-text mb-1">Share #{index + 1}</span>
                  <div className="join">
                    <input
                      className="input input-bordered join-item w-full font-mono text-sm"
                      type={showCombineShares[index] ? "text" : "password"}
                      value={share}
                      onChange={(event) => handleShareChange(index, event.target.value)}
                      placeholder={`Share ${index + 1}`}
                    />
                    <button
                      className="btn btn-outline join-item"
                      type="button"
                      onClick={() => setShowCombineShares((state) => ({ ...state, [index]: !state[index] }))}
                    >
                      {showCombineShares[index] ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="card-actions flex-wrap justify-start gap-2">
              <button className="btn btn-primary" onClick={handleCombineShares}>
                Combine Shares
              </button>
              <button className="btn btn-ghost" onClick={handleResetCombine}>
                Reset
              </button>
            </div>

          {combinedPassword && (
              <div className="space-y-2">
                <div className="divider my-2">Reconstructed Password</div>
                <div className="join w-full">
                  <input
                    className="input input-bordered join-item w-full font-semibold"
                    type={showCombinedPassword ? "text" : "password"}
                    value={combinedPassword}
                    readOnly
                  />
                  <button
                    className="btn btn-outline join-item"
                    type="button"
                    onClick={() => setShowCombinedPassword((state) => !state)}
                  >
                    {showCombinedPassword ? "Hide" : "Show"}
                  </button>
                  <button
                    className="btn btn-outline join-item"
                    type="button"
                    onClick={() => copyToClipboard(combinedPassword, setCombineMessage)}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
        </div>
      </section>
    </div>
  );
}
