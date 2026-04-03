import React, { useState, useRef } from "react";
import { encryptPassword, decryptPassword, downloadEncryptedFile, readEncryptedFile } from "../utils/encryption";

export default function EncryptionPanel({
  setPassword,
  onDecrypted,
  passwordForEncryption,
  setPasswordForEncryption
}) {
  const [masterPassword, setMasterPassword] = useState("");
  const [showPasswordForEncryption, setShowPasswordForEncryption] = useState(false);
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [encryptionMessage, setEncryptionMessage] = useState("Encrypt or decrypt passwords for secure storage.");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState("");
  const fileInputRef = useRef(null);
  const pasteSourcePassword = (decryptedPassword || passwordForEncryption || "").trim();
  const hasPasteSourcePassword = pasteSourcePassword.length > 0;

  const handleEncrypt = async () => {
    const effectivePassword = passwordForEncryption;

    if (!effectivePassword) {
      setEncryptionMessage("No password to encrypt. Generate or enter a password first.");
      return;
    }

    if (!masterPassword) {
      setEncryptionMessage("Please enter a master password for encryption.");
      return;
    }

    setIsEncrypting(true);
    try {
      const encrypted = await encryptPassword(effectivePassword, masterPassword);
      downloadEncryptedFile(encrypted);
      setEncryptionMessage("✓ Password encrypted and downloaded!");
      setMasterPassword("");
    } catch (error) {
      setEncryptionMessage(`✗ Encryption failed: ${error.message}`);
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleDecryptFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!masterPassword) {
      setEncryptionMessage("Please enter the master password first.");
      fileInputRef.current.value = "";
      return;
    }

    setIsDecrypting(true);
    try {
      const encryptedData = await readEncryptedFile(file);
      const decrypted = await decryptPassword(encryptedData, masterPassword);
      setDecryptedPassword(decrypted);
      setEncryptionMessage("✓ Password decrypted successfully!");
      setMasterPassword("");
      fileInputRef.current.value = "";
    } catch (error) {
      setEncryptionMessage(`✗ Decryption failed: ${error.message}`);
      fileInputRef.current.value = "";
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <section className="card border border-base-300/40 bg-base-200/70 shadow-2xl backdrop-blur">
      <div className="card-body">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="card-title">Encryption</h2>
          <span className="badge badge-accent badge-outline">Secure Storage</span>
        </div>

        <div className="alert alert-info py-2 text-sm">
          <span>{encryptionMessage}</span>
        </div>

        <div className="alert alert-success/70 py-2 text-sm">
          <span>
            Encryption input: {passwordForEncryption ? "Ready" : "Enter a password below or send one from another tab"}
          </span>
        </div>

        <label className="form-control mt-2">
          <span className="label-text mb-1">Password to encrypt</span>
          <div className="join">
            <input
              className="input input-bordered join-item w-full"
              type={showPasswordForEncryption ? "text" : "password"}
              value={passwordForEncryption}
              onChange={(event) => setPasswordForEncryption(event.target.value)}
              placeholder="Enter or paste the password to encrypt"
            />
            <button
              className="btn btn-outline join-item"
              type="button"
              onClick={() => setShowPasswordForEncryption((state) => !state)}
            >
              {showPasswordForEncryption ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <label className="form-control mt-2">
          <span className="label-text mb-1">Master password (for encryption/decryption)</span>
          <div className="join">
            <input
              className="input input-bordered join-item w-full"
              type={showMasterPassword ? "text" : "password"}
              value={masterPassword}
              onChange={(event) => setMasterPassword(event.target.value)}
              placeholder="Enter master password"
            />
            <button
              className="btn btn-outline join-item"
              type="button"
              onClick={() => setShowMasterPassword((state) => !state)}
            >
              {showMasterPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button
            className={`btn btn-primary ${isEncrypting ? "loading" : ""}`}
            onClick={handleEncrypt}
            disabled={isEncrypting || !passwordForEncryption || !masterPassword}
          >
            {isEncrypting ? "Encrypting..." : "Encrypt & Download"}
          </button>

          <label className="btn btn-secondary">
            {isDecrypting ? "Decrypting..." : "Upload & Decrypt"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleDecryptFile}
              disabled={isDecrypting || !masterPassword}
              className="hidden"
            />
          </label>
        </div>

        <div className="mt-4 card bg-base-100 border border-success/30">
          <div className="card-body">
            <h3 className="card-title text-sm">Paste Password</h3>
            <p className="text-xs text-base-content/70">
              {hasPasteSourcePassword
                ? "Use the current password in other tabs without copying:"
                : "Enter a password to encrypt or decrypt a file to enable paste actions."}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                className="btn btn-sm btn-success btn-outline"
                disabled={!hasPasteSourcePassword}
                onClick={() => {
                  setPassword(pasteSourcePassword);
                  if (setPasswordForEncryption) {
                    setPasswordForEncryption(pasteSourcePassword);
                  }
                  setEncryptionMessage("Password pasted to Learning tab");
                }}
              >
                Paste to Learning
              </button>
              <button
                className="btn btn-sm btn-success btn-outline"
                disabled={!hasPasteSourcePassword}
                onClick={() => {
                  if (onDecrypted) {
                    onDecrypted(pasteSourcePassword);
                  }
                  setEncryptionMessage("Password pasted to Secret Sharing tab");
                }}
              >
                Paste to Secret Sharing
              </button>
              <button
                className="btn btn-sm btn-outline"
                disabled={!hasPasteSourcePassword}
                onClick={() => {
                  setDecryptedPassword("");
                  setPasswordForEncryption("");
                  setEncryptionMessage("Password input cleared");
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-base-content/60">
          <p>• <strong>Encrypt:</strong> Uses your master password to encrypt the current password and downloads a text file.</p>
          <p>• <strong>Decrypt:</strong> Upload the encrypted file and use the same master password to decrypt it.</p>
          <p>• <strong>Paste:</strong> After decryption, use the buttons above to paste directly to other tabs without copying.</p>
          <p>• <strong>Offline:</strong> All encryption/decryption happens locally in your browser. No data is sent to any server.</p>
          <p>• <strong>Security:</strong> Uses AES-256 encryption with PBKDF2 key derivation (100,000 iterations).</p>
        </div>
      </div>
    </section>
  );
}
