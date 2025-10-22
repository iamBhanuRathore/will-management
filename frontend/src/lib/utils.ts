import { PublicKey } from "@solana/web3.js";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import nacl from "tweetnacl";

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
const isValidSolanaPublicKey = (pubkey: string): boolean => {
  try {
    new PublicKey(pubkey); // Will throw if invalid
    return true;
  } catch {
    return false;
  }
};
export const encryptWithPublicKey = (messageHex: string, recipientPublicKey: string): Buffer => {
  // SECURITY CHECK: Validate the recipient's public key format
  if (!isValidSolanaPublicKey(recipientPublicKey)) {
    throw new Error("Invalid recipient public key");
  }

  // Convert hex message to bytes for encryption
  const plaintextBytes = Buffer.from(messageHex, "hex");

  // STEP 1: Generate ephemeral key pair for this encryption session
  const ephemeralKeyPair = nacl.box.keyPair();
  const nonce = nacl.randomBytes(nacl.box.nonceLength); // 24 bytes

  try {
    // STEP 2: Convert Ed25519 public key to X25519 curve for encryption compatibility
    const ed25519PublicKeyBytes = new PublicKey(recipientPublicKey).toBytes();

    // Derive X25519 key deterministically from Ed25519 key
    // This allows the recipient to derive the same X25519 key from their Ed25519 keypair
    const x25519RecipientKey = nacl.hash(ed25519PublicKeyBytes).slice(0, 32);

    // STEP 3: Perform Diffie-Hellman key exchange to derive shared secret
    const sharedSecret = nacl.box.before(x25519RecipientKey, ephemeralKeyPair.secretKey);

    // STEP 4: Encrypt plaintext using shared secret (symmetric encryption)
    const ciphertext = nacl.secretbox(plaintextBytes, nonce, sharedSecret);

    if (!ciphertext) {
      throw new Error("Encryption failed");
    }

    // STEP 5: Construct encrypted payload for transmission
    // Format: [version(1)][ephemeral_public_key(32)][nonce(24)][ciphertext(?)]
    const versionByte = new Uint8Array([1]); // Version for protocol compatibility

    const encryptedPayload = new Uint8Array(versionByte.length + ephemeralKeyPair.publicKey.length + nonce.length + ciphertext.length);

    let position = 0;
    encryptedPayload.set(versionByte, position);
    position += versionByte.length;

    encryptedPayload.set(ephemeralKeyPair.publicKey, position);
    position += ephemeralKeyPair.publicKey.length;

    encryptedPayload.set(nonce, position);
    position += nonce.length;

    encryptedPayload.set(ciphertext, position);

    return Buffer.from(encryptedPayload);
  } finally {
    // SECURITY CLEANUP: Zero out ephemeral secret key from memory
    ephemeralKeyPair.secretKey.fill(0);
  }
};
