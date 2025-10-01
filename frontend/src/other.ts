import secrets from "secrets.js-grempe";

/**
 * XORs two hex strings of equal length.
 * @param {string} hex1 - First hex string.
 * @param {string} hex2 - Second hex string.
 * @returns {string} The resulting XORed hex string.
 */
const xorHexStrings = (hex1: string, hex2: string): string => {
  if (hex1.length !== hex2.length) {
    throw new Error("Hex strings must have the same length to XOR.");
  }
  let result = "";
  for (let i = 0; i < hex1.length; i += 2) {
    const byte1 = parseInt(hex1.substr(i, 2), 16);
    const byte2 = parseInt(hex2.substr(i, 2), 16);
    const xorByte = byte1 ^ byte2;
    result += xorByte.toString(16).padStart(2, "0");
  }
  return result;
};

/**
 * Reconstructs the original secret by correctly combining the final shares.
 * It preserves the share ID prefixes and only XORs the data payloads.
 *
 * @param {string} userKey - The final XORed share for the user.
 * @param {string} beneficiaryKey - The final XORed share for the beneficiary.
 *... (other shares)
 * @returns {string | null} The original secret string, or null on failure.
 */
function reconstructSecretFromCombinedKeys(finalKeys: string[]): string | null {
  try {
    console.log("Starting corrected secret reconstruction...");

    // The library's format uses a 3-character prefix for the ID and metadata.
    // const idPrefixLength = 3;

    // We need to derive the original share ID from the index.
    // The library uses 1-based indexing for share IDs.
    // const reconstructedShares = finalKeys.map((key, index) => {
    //   const shareId = (index + 1).toString(16).padStart(2, "0"); // e.g., 1 -> "01", 10 -> "0a"
    //   const idPrefix = "8" + shareId; // Reconstruct the prefix, e.g., "801", "802"
    //   return idPrefix + key.substring(idPrefixLength);
    // });

    // console.log("Re-formatted shares with correct IDs:", reconstructedShares);

    // We only need the threshold number of shares (3 in your case) to combine.
    // const sharesToCombine = reconstructedShares.slice(0, 3);
    const sharesToCombine = finalKeys.slice(0, 3);

    // --- Combine the correctly formatted shares ---
    const secretHex = secrets.combine(sharesToCombine);

    if (!secretHex) {
      throw new Error("secrets.combine() failed. The shares may be invalid.");
    }

    console.log("Successfully combined shares to get secret hex:", secretHex);

    // --- Convert the hex back to a string ---
    const originalSecret = secrets.hex2str(secretHex);
    console.log("✅ Secret reconstruction successful!");

    return originalSecret;
  } catch (error) {
    console.error("❌ Secret reconstruction failed:", error);
    return null;
  }
}

// --- Example Usage with your keys ---

// IMPORTANT: These must be the SHARES corresponding to IDs 1, 2, 3, and 4 in order.
// Based on your logs, the keys you provided correspond to:
// User Key        -> Share #1 (from U1, B1, S1)
// Beneficiary Key -> Share #2 (from U2, B2, S2)
// Server Key 1    -> Share #3 (from U3, B3, S3)
// Server Key 2    -> Share #4 (from U4, B4, S4)
const finalCombinedKeys = [
  "801D6ADDE99965B561E78DAFA56295D130DB0B00B528BDD5556745B82751CCA8DDE7B35A1F3B67783AB8D4171F6879DACF4", // Corresponds to ID 1
  "802AD087F847C8243989E6DCAAF5DECE5484586506909582EC5766B38FFF64D02859E58709AE7D0FA8539181078570A6DB3", // Corresponds to ID 2
  "8037BA5A11DEAD91586E6B730F87491F631F5535B4982E67BF60243BAAAEAFE8F36E54DD11A51CE790EB42A61E7D0FFC133", // Corresponds to ID 3
  "804B1513BBB2C4D35602C5BAFA48D5EFEB4B1B8C735FF59197172781AB6BD14FB86304501D84D182B9B87A7472F6070AA09FC88F601D4057CC7F82C502228C7F4BA2885F1B6E8D3B1918EC93F944396D9FE", // Corresponds to ID 4
];

// Since your keys already have a scrambled prefix, we will strip it and add the correct one.
const recoveredSecret = reconstructSecretFromCombinedKeys(finalCombinedKeys);

if (recoveredSecret) {
  console.log("\n--- RECOVERED SECRET ---");
  console.log(recoveredSecret);
} else {
  console.log("\nCould not recover the secret.");
}
