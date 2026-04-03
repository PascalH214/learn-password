import React, { useEffect, useState } from "react";
import GeneratorPanel from "./components/GeneratorPanel";
import LearningPanel from "./components/LearningPanel";
import SharingPanel from "./components/SharingPanel";
import EncryptionPanel from "./components/EncryptionPanel";

export default function App() {
  const [activeTab, setActiveTab] = useState("generator");
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === "undefined") {
      return true;
    }
    return navigator.onLine;
  });
  const [password, setPassword] = useState("");
  const [sharingPanelPassword, setSharingPanelPassword] = useState("");
  const [passwordForEncryption, setPasswordForEncryption] = useState("");

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

  const useGeneratedForLearning = (value) => {
    setPassword(value);
  };

  const useGeneratedForEncryption = (value) => {
    setPasswordForEncryption(value);
    setActiveTab("encryption");
  };

  const useGeneratedForSecretSharing = (value) => {
    setSharingPanelPassword(value);
    setActiveTab("sharing");
  };

  const useLearningForEncryption = (value, setCopyMessage) => {
    if (!value) {
      setCopyMessage("Enter a password first.");
      return;
    }

    setPasswordForEncryption(value);
    setCopyMessage("Using current learning password for encryption.");
    setActiveTab("encryption");
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
          <button
            className={`tab ${activeTab === "encryption" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("encryption")}
          >
            Encryption
          </button>
        </div>

        <div className={activeTab === "generator" ? "block" : "hidden"}>
          <div className="grid gap-5 lg:grid-cols-2">
            <GeneratorPanel
              onUseForLearning={useGeneratedForLearning}
              onUseForEncryption={useGeneratedForEncryption}
              onUseForSecretSharing={useGeneratedForSecretSharing}
            />

            <LearningPanel
              password={password}
              setPassword={setPassword}
              useLearningForEncryption={useLearningForEncryption}
            />
          </div>
        </div>

        <div className={activeTab === "sharing" ? "block" : "hidden"}>
          <SharingPanel
            sharingPanelPassword={sharingPanelPassword}
            setSharingPanelPassword={setSharingPanelPassword}
            onUseForEncryption={(value) => {
              setPasswordForEncryption(value);
              setActiveTab("encryption");
            }}
          />
        </div>

        <div className={activeTab === "encryption" ? "block" : "hidden"}>
          <div className="grid gap-5">
            <EncryptionPanel
              setPassword={setPassword}
              onDecrypted={setSharingPanelPassword}
              passwordForEncryption={passwordForEncryption}
              setPasswordForEncryption={setPasswordForEncryption}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
