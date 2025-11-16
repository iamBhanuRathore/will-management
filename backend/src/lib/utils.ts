import type { User } from "@prisma/client";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { prisma } from "./db.ts";
import { PublicKey } from "@solana/web3.js";

// Define a consistent structure for the function's return value
type VerificationResult = { success: true; user: User } | { success: false; message: string; status: 400 | 401 | 403 | 404 };

/**
 * Verifies a signed message from a Solana wallet.
 * This function checks the signature's authenticity, matches the public key,
 * and validates the nonce against the one stored in the database.
 *
 * @param {string} address - The base58 encoded public key of the signer.
 * @param {string} signature - The base58 encoded signature.
 * @param {string} message - The full message that was signed.
 * @returns {Promise<VerificationResult>} An object indicating success or failure with details.
 */
export const verifySolanaSignature = async (address: string, signature: string, message: string): Promise<VerificationResult> => {
  try {
    // 1. Retrieve the user and their expected nonce from the database
    const user = await prisma.user.findUnique({ where: { address } });

    if (!user) {
      return {
        success: false,
        message: "User with this address does not exist.",
        status: 404,
      };
    }
    if (!user.nonce) {
      return {
        success: false,
        message: "No active nonce for this user. Please request one first.",
        status: 400,
      };
    }

    // 2. Decode the necessary components from base58
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(address);

    // 3. Verify the signature against the message and public key
    const isSignatureValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

    if (!isSignatureValid) {
      return {
        success: false,
        message: "Signature verification failed. The signature does not match the address.",
        status: 401,
      };
    }

    // 4. Extract the nonce from the signed message and compare it with the stored nonce
    // This regular expression is safer as it looks for the start of the line or a newline before "Nonce:"
    const nonceFromMessage = message.match(/(?:^|\n)Nonce: (.*)/)?.[1];

    if (nonceFromMessage !== user.nonce) {
      return {
        success: false,
        message: "Invalid nonce. The nonce in the message does not match the expected nonce.",
        status: 403,
      };
    }

    // 5. If all checks pass, return success with the user object
    return { success: true, user };
  } catch (error) {
    console.error("An error occurred during signature verification:", error);
    // This catch block handles errors like invalid base58 decoding
    return {
      success: false,
      message: "Invalid signature, address, or message format.",
      status: 400,
    };
  }
};

export const xorHexStrings = (hex1: string, hex2: string): string => {
  console.log(`XOR Debug: hex1 length=${hex1.length}, hex2 length=${hex2.length}, hex1=${hex1}, hex2=${hex2}`);

  if (hex1.length !== hex2.length) {
    console.error("Length mismatch after normalization:", hex1.length, hex2.length);
    throw new Error(`Hex strings still have different lengths after normalization: ${hex1.length} vs ${hex2.length}`);
  }
  let result = "";
  for (let i = 0; i < hex1.length; i++) {
    const byte1 = parseInt(hex1.charAt(i), 16); // Convert hex pair to number
    const byte2 = parseInt(hex2.charAt(i), 16); // Convert hex pair to number
    const xorByte = byte1 ^ byte2; // XOR the two bytes
    result += xorByte.toString(16).toUpperCase();
  }
  // Process hex string 2 characters at a time (each pair represents 1 byte)
  //  for (let i = 0; i < hex1.length; i += 2) { // ✅ Increment by 2
  //   const byte1 = parseInt(hex1.substr(i, 2), 16); // ✅ Process 2 chars (1 byte)
  //   const byte2 = parseInt(hex2.substr(i, 2), 16); // ✅ Process 2 chars (1 byte)
  //   const xorByte = byte1 ^ byte2; // XOR the two bytes
  //   result += xorByte.toString(16).padStart(2, "0"); // ✅ Always 2 digits
  // }
  console.log("this works", result.length);
  return result;
};

export const secureClear = (obj: any) => {
  if (typeof obj === "string") {
    return "0".repeat(obj.length);
  }
  if (obj instanceof Uint8Array || obj instanceof Buffer) {
    obj.fill(0);
  }
  return null;
};

// Input Validation: Check if a string is a valid Solana public key
export const isValidSolanaPublicKey = (pubkey: string) => {
  try {
    new PublicKey(pubkey);
    return true;
  } catch {
    return false;
  }
};
