import { PublicKey } from "@solana/web3.js";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { Buffer } from "buffer";
import * as ed2curve from "ed2curve";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const createEncodedMessage = (
  messageText: string,
  nonce: string
): {
  encodedMessage: Uint8Array;
  message: string;
} => {
  const domain = new URL(window.location.href).origin;
  const message = `${messageText} with ${domain}.\nNonce: ${nonce}`;
  // TextEncoder().encode() returns Uint8Array, which is the correct format for most signing APIs.
  const encodedMessage = new TextEncoder().encode(message);

  return { encodedMessage, message };
};

export const generateSecureRandomHex = (bits: number): string => {
  const bytes = Math.ceil(bits / 8); // Convert bits to bytes (8 bits = 1 byte)
  const randomBytes = new Uint8Array(bytes);
  crypto.getRandomValues(randomBytes); // Use browser's secure random generator

  // Convert each byte to 2-digit hex and join them
  return Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
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
export const isValidSolanaPublicKey = (pubkey: string): boolean => {
  try {
    new PublicKey(pubkey); // Will throw if invalid
    return true;
  } catch {
    return false;
  }
};

// For hex input (your current approach)

export const encryptTextMessage = (message: string, recipientPublicKeyBase58: string): Uint8Array => {
  let recipientEdBytes: Uint8Array;
  try {
    recipientEdBytes = bs58.decode(recipientPublicKeyBase58);
    if (recipientEdBytes.length !== 32) {
      throw new Error("Decoded public key is not 32 bytes");
    }
  } catch (e) {
    console.error("Failed to decode base58 public key:", e);
    throw new Error("Invalid public key format");
  }

  const recipientCurveBytes = ed2curve.convertPublicKey(recipientEdBytes);
  if (!recipientCurveBytes) {
    console.error("Failed to convert Ed25519 to Curve25519:", { recipientEdBytes });
    throw new Error("Invalid public key");
  }

  const plaintextBytes = new TextEncoder().encode(message);
  const ephemeralKeyPair = nacl.box.keyPair();
  const sharedKey = nacl.box.before(recipientCurveBytes, ephemeralKeyPair.secretKey);
  const nonce = nacl.randomBytes(nacl.box.nonceLength); // 24 bytes
  const encrypted = nacl.secretbox(plaintextBytes, nonce, sharedKey);
  const payload = new Uint8Array(32 + 24 + encrypted.length);
  payload.set(ephemeralKeyPair.publicKey, 0);
  payload.set(nonce, 32);
  payload.set(encrypted, 56);
  return payload;
};

export const encryptHexMessage = (messageHex: string, recipientPublicKeyBase58: string): Uint8Array => {
  let recipientEdBytes: Uint8Array;
  try {
    recipientEdBytes = bs58.decode(recipientPublicKeyBase58);
    if (recipientEdBytes.length !== 32) {
      throw new Error("Decoded public key is not 32 bytes");
    }
  } catch (e) {
    console.error("Failed to decode base58 public key:", e);
    throw new Error("Invalid public key format");
  }

  const recipientCurveBytes = ed2curve.convertPublicKey(recipientEdBytes);
  if (!recipientCurveBytes) {
    console.error("Failed to convert Ed25519 to Curve25519:", { recipientEdBytes });
    throw new Error("Invalid public key");
  }

  const plaintextBytes = Buffer.from(messageHex, "hex");
  const ephemeralKeyPair = nacl.box.keyPair();
  const nonce = nacl.randomBytes(nacl.box.nonceLength); // 24 bytes
  const encrypted = nacl.box(plaintextBytes, nonce, recipientCurveBytes, ephemeralKeyPair.secretKey);
  const payload = new Uint8Array(32 + 24 + encrypted.length);
  payload.set(ephemeralKeyPair.publicKey, 0);
  payload.set(nonce, 32);
  payload.set(encrypted, 56);
  return payload;
};

export const decryptWithPrivateKey = (encryptedPayload: Uint8Array, privateKeyBase58: string): string => {
  let secretKeyBytes: Uint8Array;
  try {
    secretKeyBytes = bs58.decode(privateKeyBase58);
    if (secretKeyBytes.length !== 64) {
      throw new Error("Decoded private key is not 64 bytes");
    }
  } catch (e) {
    console.error("Failed to decode base58 private key:", e);
    return "Decryption failed: invalid private key format";
  }

  const ephemeralPublicKey = encryptedPayload.slice(0, 32);
  const nonce = encryptedPayload.slice(32, 56);
  const ciphertext = encryptedPayload.slice(56);
  const seed = secretKeyBytes.slice(0, 32);
  const h = nacl.hash(seed); // SHA-512
  let scalar = h.slice(0, 32);
  scalar[0] &= 248;
  scalar[31] &= 127;
  scalar[31] |= 64;
  const encryptionKeypair = nacl.box.keyPair.fromSecretKey(scalar);
  const sharedKey = nacl.box.before(ephemeralPublicKey, encryptionKeypair.secretKey);
  const decrypted = nacl.secretbox.open(ciphertext, nonce, sharedKey);
  if (!decrypted) {
    console.error("Decryption failed: invalid ciphertext or keys");
    return "Decryption failed";
  }
  return new TextDecoder().decode(decrypted);
};
