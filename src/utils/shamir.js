import { split, combine } from "shamirs-secret-sharing";

/**
 * Convert a string password to Uint8Array for Shamir's Secret Sharing
 * @param {string} password - The password to convert
 * @returns {Uint8Array} Byte array representation
 */
export function passwordToBytes(password) {
  const encoder = new TextEncoder();
  return encoder.encode(password);
}

/**
 * Convert Uint8Array back to password string
 * @param {Uint8Array} bytes - The byte array
 * @returns {string} The original password
 */
export function bytesToPassword(bytes) {
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

/**
 * Convert Uint8Array to hex string for display
 * @param {Uint8Array} bytes - The byte array
 * @returns {string} Hex representation
 */
export function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Convert hex string back to Uint8Array
 * @param {string} hex - The hex string
 * @returns {Uint8Array} The byte array
 */
export function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Split a password into shares using Shamir's Secret Sharing
 * @param {string} password - The password to split
 * @param {number} totalShares - Total number of shares to generate (2-255)
 * @param {number} threshold - Minimum shares needed to reconstruct (2-totalShares)
 * @returns {object} Object containing shares and metadata
 */
export function splitPassword(password, totalShares = 5, threshold = 3) {
  if (totalShares < 2 || totalShares > 255) {
    throw new Error("Total shares must be between 2 and 255");
  }
  if (threshold < 2 || threshold > totalShares) {
    throw new Error("Threshold must be between 2 and totalShares");
  }
  if (!password || password.trim().length === 0) {
    throw new Error("Password cannot be empty");
  }

  try {
    // Convert password to bytes
    const bytes = passwordToBytes(password);

    // Split into shares - returns array of Uint8Array
    const shareArrays = split(bytes, {
      shares: totalShares,
      threshold,
    });

    // Convert each share to hex for display
    const shares = shareArrays.map((share) => bytesToHex(share));

    return {
      success: true,
      shares,
      totalShares,
      threshold,
      originalPassword: password,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      shares: [],
      totalShares,
      threshold,
      originalPassword: password,
      error: error.message,
    };
  }
}

/**
 * Combine shares to reconstruct the original password
 * @param {array} selectedShares - Array of hex shares to combine
 * @returns {object} Object containing reconstructed password or error
 */
export function combineShares(selectedShares) {
  if (!selectedShares || selectedShares.length < 2) {
    return {
      success: false,
      password: "",
      error: "Need at least 2 shares to reconstruct",
    };
  }

  try {
    // Filter out empty shares
    const validShares = selectedShares.filter((share) => share && share.trim().length > 0);

    if (validShares.length < 2) {
      return {
        success: false,
        password: "",
        error: "Need at least 2 valid shares to reconstruct",
      };
    }

    // Convert hex shares back to Uint8Array
    const shareArrays = validShares.map((share) => hexToBytes(share));

    // Combine shares
    const reconstructedBytes = combine(shareArrays);

    // Convert back to password
    const password = bytesToPassword(reconstructedBytes);

    return {
      success: true,
      password,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      password: "",
      error: error.message,
    };
  }
}

/**
 * Validate if a string is a valid hex share
 * @param {string} share - The share to validate
 * @returns {boolean} True if valid
 */
export function isValidShare(share) {
  if (!share || typeof share !== "string") {
    return false;
  }
  // Check if it's valid hex
  return /^[0-9a-f]+$/i.test(share) && share.length > 0 && share.length % 2 === 0;
}
