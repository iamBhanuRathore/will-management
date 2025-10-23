import { Keypair, PublicKey } from "@solana/web3.js";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { MY_PRIVATE_KEY } from "@/lib/constant";

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

const deriveEncryptionKeypair = async (signMessage: (message: Uint8Array) => Promise<Uint8Array>): Promise<nacl.BoxKeyPair> => {
  // Use a fixed message to derive a deterministic keypair
  const derivationMessage = new TextEncoder().encode("DERIVE_ENCRYPTION_KEYPAIR_V1");
  const signature = await signMessage(derivationMessage);

  // Use the first 32 bytes of the signature as the seed
  const seed = signature.slice(0, 32);

  // Generate X25519 keypair from seed
  return nacl.box.keyPair.fromSecretKey(seed);
};

// For hex input (your current approach)
export const encryptWithPublicKey = (messageHex: string, recipientEncryptionPublicKey: string): Uint8Array => {
  const recipientPublicKeyBytes = bs58.decode(recipientEncryptionPublicKey);
  const plaintextBytes = Buffer.from(messageHex, "hex");

  const ephemeralKeyPair = nacl.box.keyPair();
  const nonce = nacl.randomBytes(nacl.box.nonceLength); // 24 bytes

  const encrypted = nacl.box(plaintextBytes, nonce, recipientPublicKeyBytes, ephemeralKeyPair.secretKey);

  // Construct payload: ephemeralPublicKey(32) + nonce(24) + ciphertext
  const payload = new Uint8Array(32 + 24 + encrypted.length);
  payload.set(ephemeralKeyPair.publicKey, 0);
  payload.set(nonce, 32);
  payload.set(encrypted, 56);

  return payload;
};

export const encryptMessage = (message: string, recipientEncryptionPublicKey: string): Uint8Array => {
  const recipientPublicKeyBytes = bs58.decode(recipientEncryptionPublicKey);
  const plaintextBytes = new TextEncoder().encode(message);
  const ephemeralKeyPair = nacl.box.keyPair();
  const nonce = nacl.randomBytes(24);
  const sharedSecret = nacl.box.before(recipientPublicKeyBytes, ephemeralKeyPair.secretKey);
  const encrypted = nacl.box.after(plaintextBytes, nonce, sharedSecret);
  const payload = new Uint8Array(32 + 24 + encrypted.length);
  payload.set(ephemeralKeyPair.publicKey, 0);
  payload.set(nonce, 32);
  payload.set(encrypted, 56);
  console.log("Total payload length:", payload.length);
  return payload;
};

export const decryptWithPrivateKey = async (encryptedPayload: Uint8Array, privateKeyBase58: string): Promise<string> => {
  console.log("=== DECRYPTION DEBUG ===");
  console.log("Encrypted payload length:", encryptedPayload.length);

  // Parse payload
  const ephemeralPublicKey = encryptedPayload.slice(0, 32);
  const nonce = encryptedPayload.slice(32, 56);
  const ciphertext = encryptedPayload.slice(56);

  console.log("Ephemeral public key:", bs58.encode(ephemeralPublicKey));
  console.log("Nonce length:", nonce.length);
  console.log("Ciphertext length:", ciphertext.length);

  // Decode private key
  const secretKeyUint8 = bs58.decode(privateKeyBase58);
  const keypair = Keypair.fromSecretKey(secretKeyUint8);
  const privateKey = keypair.secretKey.slice(0, 32);

  console.log("My public key:", keypair.publicKey.toBase58());

  // Create shared secret and decrypt
  const sharedSecret = nacl.box.before(ephemeralPublicKey, privateKey);
  const decrypted = nacl.box.open.after(ciphertext, nonce, sharedSecret);

  if (!decrypted) {
    console.error("❌ Decryption failed - key mismatch or corrupted data");
    throw new Error("Decryption failed");
  }

  console.log("✅ Decryption successful!");
  return new TextDecoder().decode(decrypted);
};
