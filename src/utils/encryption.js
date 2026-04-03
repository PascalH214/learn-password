/**
 * Encryption/Decryption utilities for password storage
 * Uses Web Crypto API (available in all modern browsers, works offline)
 */

/**
 * Derive a key from a password using PBKDF2
 * @param {string} password - The password to derive key from
 * @param {Uint8Array} salt - Salt for key derivation
 * @returns {Promise<CryptoKey>} - Derived encryption key
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  const baseKey = await crypto.subtle.importKey("raw", passwordData, "PBKDF2", false, [
    "deriveBits",
    "deriveKey"
  ]);

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a password with an encryption key (master password)
 * @param {string} passwordToEncrypt - The password to encrypt
 * @param {string} masterPassword - The master password used for encryption
 * @returns {Promise<string>} - Base64 encoded encrypted data with metadata
 */
export async function encryptPassword(passwordToEncrypt, masterPassword) {
  if (!passwordToEncrypt || !masterPassword) {
    throw new Error("Both password and master password are required");
  }

  try {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derive key from master password
    const key = await deriveKey(masterPassword, salt);

    // Encrypt the password
    const encoder = new TextEncoder();
    const dataToEncrypt = encoder.encode(passwordToEncrypt);

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      dataToEncrypt
    );

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

    // Convert to base64 for easy file storage
    const binaryString = String.fromCharCode(...combined);
    const base64 = btoa(binaryString);

    return base64;
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt a password using master password
 * @param {string} encryptedBase64 - Base64 encoded encrypted data
 * @param {string} masterPassword - The master password used for decryption
 * @returns {Promise<string>} - The decrypted password
 */
export async function decryptPassword(encryptedBase64, masterPassword) {
  if (!encryptedBase64 || !masterPassword) {
    throw new Error("Both encrypted data and master password are required");
  }

  try {
    // Decode from base64
    const binaryString = atob(encryptedBase64);
    const combined = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      combined[i] = binaryString.charCodeAt(i);
    }

    // Extract salt, iv, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encryptedData = combined.slice(28);

    // Derive key from master password
    const key = await deriveKey(masterPassword, salt);

    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      encryptedData
    );

    // Convert back to string
    const decoder = new TextDecoder();
    const password = decoder.decode(decryptedData);

    return password;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Create a downloadable encrypted password file
 * @param {string} encryptedData - The encrypted password (base64 string)
 * @param {string} filename - Name for the downloaded file
 */
export function downloadEncryptedFile(encryptedData, filename = "encrypted-password.txt") {
  const element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(encryptedData));
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/**
 * Read an encrypted password file
 * @param {File} file - The file to read
 * @returns {Promise<string>} - The encrypted data (base64 string)
 */
export function readEncryptedFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result.trim();
      resolve(content);
    };
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    reader.readAsText(file);
  });
}
