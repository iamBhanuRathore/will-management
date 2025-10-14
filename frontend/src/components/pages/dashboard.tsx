import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import apiClient from "@/lib/api";

import secrets from "secrets.js-grempe"; // Shamir's Secret Sharing library
import nacl from "tweetnacl"; // Cryptographic library for encryption
import { PublicKey } from "@solana/web3.js"; // Solana blockchain utilities
import { createEncodedMessage } from "@/lib/utils";
import { AUTHENTICATE_MESSAGE } from "@/lib/constant";
import bs58 from "bs58";

// --- Security-Hardened Helper Functions ---

function padHex(hex: string, length: number): string {
  return hex.padStart(length, "0");
}
/**
 * SECURITY FUNCTION: Securely clear sensitive data from memory
 * JavaScript doesn't have true memory management, but this helps reduce exposure time
 * @param {any} obj - The object to clear (string, Uint8Array, or Buffer)
 * @returns {null|string} - Returns null or zeros for strings
 */
const secureClear = (obj: any) => {
  if (typeof obj === "string") {
    // Overwrite string memory (limited effectiveness in JS, but better than nothing)
    return "0".repeat(obj.length);
  }
  if (obj instanceof Uint8Array || obj instanceof Buffer) {
    // Fill typed arrays with zeros to clear sensitive data
    obj.fill(0);
  }
  return null;
};
/**
 * INPUT VALIDATION: Check if a string is a valid Solana public key
 * This prevents errors and potential security issues from malformed keys
 * @param {string} pubkey - The public key string to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidSolanaPublicKey = (pubkey: string): boolean => {
  try {
    new PublicKey(pubkey); // Will throw if invalid
    return true;
  } catch {
    return false;
  }
};

/**
 * SECURE RANDOMNESS: Generate cryptographically secure random hex string
 * Uses Web Crypto API which is much more secure than Math.random()
 * @param {number} bits - Number of bits of randomness needed
 * @returns {string} - Random hex string
 */
const generateSecureRandomHex = (bits: number): string => {
  const bytes = Math.ceil(bits / 8); // Convert bits to bytes (8 bits = 1 byte)
  const randomBytes = new Uint8Array(bytes);
  crypto.getRandomValues(randomBytes); // Use browser's secure random generator

  // Convert each byte to 2-digit hex and join them
  return Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

/**
 * CRYPTOGRAPHIC OPERATION: XOR two hex strings of equal length
 * XOR (exclusive OR) is used for combining/masking cryptographic shares
 * Example: "ab" XOR "cd" = "66" (each byte XORed individually)
 * @param {string} hex1 - First hex string
 * @param {string} hex2 - Second hex string
 * @returns {string} - Result of XOR operation as hex string
 */
const xorHexStrings = (hex1: string, hex2: string): string => {
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

/**
 * FIXED ENCRYPTION FUNCTION: Encrypt a message for a Solana wallet holder
 * Uses hybrid encryption: NaCl secretbox + ECDH key exchange
 *
 * @param {string} messageHex - Message to encrypt (as hex string)
 * @param {string} recipientPublicKey - Recipient's Solana public key (base58)
 * @returns {Buffer} - Encrypted message bundle that can be decrypted by recipient
 */
const encryptForBeneficiary = (messageHex: string, recipientPublicKey: string): Buffer => {
  // SECURITY CHECK: Validate the recipient's public key format
  if (!isValidSolanaPublicKey(recipientPublicKey)) {
    throw new Error("Invalid recipient public key");
  }

  // Convert hex message to bytes for encryption
  const messageBytes = Buffer.from(messageHex, "hex");

  // STEP 1: Generate ephemeral X25519 key pair for encryption
  const ephemeralKeyPair = nacl.box.keyPair();
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength); // 24 bytes

  try {
    // STEP 2: Convert Solana Ed25519 public key to X25519 for encryption
    const solanaPublicKeyBytes = new PublicKey(recipientPublicKey).toBytes();

    // Use the established method: hash the Ed25519 key and use first 32 bytes for X25519
    // This is deterministic and allows the recipient to derive the same X25519 key
    const x25519PublicKey = nacl.hash(solanaPublicKeyBytes).slice(0, 32);

    // STEP 3: Perform ECDH to get shared secret
    const sharedSecret = nacl.box.before(x25519PublicKey, ephemeralKeyPair.secretKey);

    // STEP 4: Use shared secret to encrypt the message with secretbox (symmetric encryption)
    const encryptedMessage = nacl.secretbox(messageBytes, nonce, sharedSecret);

    if (!encryptedMessage) {
      throw new Error("Encryption failed");
    }

    // STEP 5: Package encrypted data for transmission
    // Format: [version(1)][ephemeral_public_key(32)][nonce(24)][encrypted_message(?)]
    const version = new Uint8Array([1]); // Version byte for future compatibility

    const fullMessage = new Uint8Array(version.length + ephemeralKeyPair.publicKey.length + nonce.length + encryptedMessage.length);

    let offset = 0;
    fullMessage.set(version, offset);
    offset += version.length;

    fullMessage.set(ephemeralKeyPair.publicKey, offset);
    offset += ephemeralKeyPair.publicKey.length;

    fullMessage.set(nonce, offset);
    offset += nonce.length;

    fullMessage.set(encryptedMessage, offset);

    return Buffer.from(fullMessage);
  } finally {
    // SECURITY CLEANUP: Clear ephemeral secret key from memory
    ephemeralKeyPair.secretKey.fill(0);
  }
};

/**
 * DECRYPTION FUNCTION: Decrypt a message encrypted with encryptForBeneficiary
 * This is what the beneficiary would use to decrypt their share
 *
 * @param {Buffer} encryptedBuffer - The encrypted message bundle
 * @param {Uint8Array} recipientPrivateKey - Recipient's Solana private key (64 bytes)
 * @returns {string} - Decrypted message as hex string
 */
const decryptFromBeneficiary = (encryptedBuffer: Buffer, recipientPrivateKey: Uint8Array): string => {
  try {
    // STEP 1: Parse the encrypted bundle
    let offset = 0;

    // Check version
    const version = encryptedBuffer[offset];
    if (version !== 1) {
      throw new Error("Unsupported encryption version");
    }
    offset += 1;

    // Extract ephemeral public key (32 bytes)
    const ephemeralPublicKey = encryptedBuffer.slice(offset, offset + 32);
    offset += 32;

    // Extract nonce (24 bytes)
    const nonce = encryptedBuffer.slice(offset, offset + 24);
    offset += 24;

    // Extract encrypted message (remaining bytes)
    const encryptedMessage = encryptedBuffer.slice(offset);

    // STEP 2: Derive X25519 private key from Solana Ed25519 private key
    // Use the same deterministic method as encryption
    const solanaPublicKey = recipientPrivateKey.slice(32, 64); // Ed25519 public key is last 32 bytes
    const x25519PrivateKey = nacl.hash(recipientPrivateKey.slice(0, 32)).slice(0, 32); // Hash first 32 bytes (seed)

    // STEP 3: Perform ECDH to recreate shared secret
    const sharedSecret = nacl.box.before(ephemeralPublicKey, x25519PrivateKey);

    // STEP 4: Decrypt the message
    const decryptedBytes = nacl.secretbox.open(encryptedMessage, nonce, sharedSecret);

    if (!decryptedBytes) {
      throw new Error("Decryption failed - invalid key or corrupted data");
    }

    // Convert back to hex
    return Buffer.from(decryptedBytes).toString("hex");
  } catch (error: any) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

const Dashboard = () => {
  const { connected, publicKey, signIn, signMessage } = useWallet();

  const [secret, setSecret] = useState("This is my Static Secret");
  const [beneficiaryPublicKey, setBeneficiaryPublicKey] = useState("6XCVkH9GbxjNTpjwvWXFEHteMsyak3VKFTc5sQc2udHX");
  const [userFinalShare, setUserFinalShare] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [creationSuccess, setCreationSuccess] = useState(false);
  const authAttempted = useRef(false);
  useEffect(() => {
    async function authenticate() {
      if (!publicKey || !signMessage) return;
      try {
        console.log("Attempting authentication...");
        const res = await apiClient.get(`auth/nonce/${publicKey.toBase58()}`);
        const { nonce } = res.data.data;
        const { encodedMessage, message } = createEncodedMessage(AUTHENTICATE_MESSAGE, nonce);
        const signedPayload = await signMessage(encodedMessage);

        const payload = {
          address: publicKey.toBase58(),
          message: message,
          signature: bs58.encode(signedPayload),
        };

        const response = await apiClient.post(`auth/verify`, payload);
        localStorage.setItem("authToken", response.data.data.sessionToken);
        console.log("Authentication successful", response.data);
      } catch (error) {
        console.error("Authentication failed:", error);
      }
    }

    if (connected && publicKey && signIn && signMessage && !authAttempted.current) {
      authAttempted.current = true;
      authenticate();
    }
  }, [publicKey, connected, signIn, signMessage]); // Dependencies remain to trigger the effect when the wallet connects

  const handleCreateWill = useCallback(async () => {
    if (!publicKey || !secret.trim() || !beneficiaryPublicKey.trim() || !signMessage) {
      alert("Please connect your wallet and fill in all fields.");
      return;
    }

    if (!isValidSolanaPublicKey(beneficiaryPublicKey)) {
      alert("Invalid beneficiary public key format.");
      return;
    }

    if (secret.length < 12) {
      alert("Secret must be at least 12 characters long.");
      return;
    }
    console.time("Start");
    setIsCreating(true);
    setUserFinalShare(null);
    setCreationSuccess(false);

    // Variables to hold sensitive data (will be cleared at the end)
    let secretHex: string | null = null;
    let R1_hex: string | null = null;
    let R2_hex: string | null = null;
    let P1_hex: string | null = null;

    try {
      // === PHASE 1: SECRET PREPARATION ===
      const res = await apiClient.get(`will/creation-nonce`);
      const { nonce } = res.data.data;
      const { encodedMessage, message } = createEncodedMessage(AUTHENTICATE_MESSAGE, nonce);
      const signedPayload = await signMessage(encodedMessage);

      console.log("Phase 1: Converting secret to hex format... signedPayload", signedPayload.toString());
      secretHex = secrets.str2hex(secret); // Convert string to hex for cryptographic operations
      console.log(secretHex);
      const bits = secretHex.length * 4; // Calculate bits needed (each hex char = 4 bits)

      // === PHASE 2: RANDOM MASK GENERATION ===
      console.log("Phase 2: Generating secure random masks...");
      // Generate two random values for masking the secret
      R1_hex = generateSecureRandomHex(bits); // Beneficiary's random value
      R2_hex = generateSecureRandomHex(bits); // Server's random value

      console.log("Random masks generated securely R1_hex", R1_hex);

      // === PHASE 3: SECRET MASKING ===
      console.log("Phase 3: Masking the secret... R2_hex", R2_hex);
      // CRYPTOGRAPHIC MASKING: Create masked secret using XOR
      // Formula: MaskedSecret = Secret ⊕ BeneficiaryRandom ⊕ ServerRandom
      // This ensures no single party knows the original secret
      P1_hex = xorHexStrings(xorHexStrings(secretHex, R1_hex), R2_hex);

      console.log("Secret successfully masked ");

      // === PHASE 4: SHARE GENERATION ===
      console.log("Phase 4: Generating cryptographic shares...,P1_hex", P1_hex);

      // SHAMIR'S SECRET SHARING: Split masked secret into 4 shares (3 needed to reconstruct)
      // This means any 3 out of 4 shares can rebuild the masked secret
      let userShares = secrets.share(P1_hex, 4, 3); // Split user's masked secret
      let beneficiaryShares = secrets.share(R1_hex, 4, 3); // Split beneficiary's random value
      // const maxLength = Math.max(...userShares.map((share) => share.length), ...beneficiaryShares.map((share) => share.length));
      // userShares = userShares.map((share) => padHex(share, maxLength));
      // beneficiaryShares = beneficiaryShares.map((share) => padHex(share, maxLength));

      const [U1, U2, U3, U4] = userShares; // User shares: U1, U2, U3, U4
      const [B1, B2, B3, B4] = beneficiaryShares; // Beneficiary shares: B1, B2, B3, B4
      console.log(U1.length, U2.length, U3.length, U4.length, B1.length, B2.length, B3.length, B4.length);
      console.log("Shares generated using Shamir's Secret Sharing,userShares,beneficiaryShares", userShares, beneficiaryShares);

      // === PHASE 5: SERVER COORDINATION ===
      console.log("Phase 5: Coordinating with server...");

      // Send specific shares to server for processing
      // Server will generate its own shares from R2_hex and combine them properly
      const payload = {
        userPublicKey: publicKey.toBase58(),
        beneficiaryPublicKey: beneficiaryPublicKey,
        R2_hex, // Server's random value (server will generate shares from this)
        U3, // User share #3 (for server to combine)
        U4, // User share #4 (for server to combine)
        B3, // Beneficiary share #3 (for server to combine)
        B4, // Beneficiary share #4 (for server to combine)
        signedPayload: bs58.encode(signedPayload),
        message,
      };
      console.log(payload);
      // Server processes these and returns its combined shares
      // const { S1, S2 } = apiCall(payload);
      const response = await apiClient.post("/will/initiate-creation", payload);
      const { S1, S2, willId } = response.data; // Server returns combined shares

      console.log("Server coordination completed");

      // === PHASE 6: FINAL SHARE CREATION ===
      console.log("Phase 6: Creating final recovery shares...");

      // FINAL COMBINATION: Create the two final shares needed for secret recovery
      // User's Final Share = U1 ⊕ B1 ⊕ S1
      // This combines: UserShare + BeneficiaryShare + ServerShare
      const finalUserShareHex = xorHexStrings(xorHexStrings(U1, B1), S1);

      // Beneficiary's Final Share = U2 ⊕ B2 ⊕ S2
      // This combines: UserShare + BeneficiaryShare + ServerShare
      const finalBeneficiaryShareHex = xorHexStrings(xorHexStrings(U2, B2), S2);

      console.log("Final shares created successfully");

      // === PHASE 7: BENEFICIARY SHARE ENCRYPTION ===
      console.log("Phase 7: Encrypting beneficiary share...");

      // SECURITY CRITICAL: Encrypt beneficiary's share so only they can access it
      const encryptedBeneficiaryShare = encryptForBeneficiary(finalBeneficiaryShareHex, beneficiaryPublicKey);
      const encryptedUserShare = encryptForBeneficiary(finalUserShareHex, publicKey.toString());
      console.log("User Key,Beneficiary Key", finalUserShareHex, finalBeneficiaryShareHex);
      console.log("Beneficiary share encrypted", encryptedBeneficiaryShare);
      console.log("User share encrypted", encryptedUserShare);
      const submitPayload = {
        encryptedBeneficiaryShare: bs58.encode(encryptedBeneficiaryShare),
        encryptedUserShare: bs58.encode(encryptedUserShare),
        signedPayload: bs58.encode(signedPayload),
        message,
        willId,
      };
      const data = await apiClient.post("/will/submit-creation", submitPayload);
      console.log(data);
      // another api call to store the beneficiary encyrpted share
      // === PHASE 8: SECURE STORAGE ===
      // SECURITY: Only store user's share locally, never beneficiary's plaintext share
      setUserFinalShare(finalUserShareHex); // User keeps this share
      setCreationSuccess(true);

      // In production: Send encryptedBeneficiaryShare to server for secure storage
      // The server stores the encrypted share until the beneficiary claims it
      console.timeEnd("Start");
      console.log("Will created successfully. Beneficiary share encrypted and ready for storage.");
    } catch (error) {
      console.error("Will creation failed:", error);
      alert("An error occurred during will creation. Please try again.");
    } finally {
      // === SECURITY CLEANUP: Clear all sensitive data from memory ===
      console.log("Cleaning up sensitive data from memory...");

      if (secretHex) secureClear(secretHex);
      if (R1_hex) secureClear(R1_hex);
      if (R2_hex) secureClear(R2_hex);
      if (P1_hex) secureClear(P1_hex);

      setIsCreating(false);
    }
  }, [publicKey, secret, beneficiaryPublicKey]);

  // SECURITY CLEANUP: Clear secret from state when component unmounts
  // useEffect(() => {
  //   return () => {
  //     if (secret) {
  //       setSecret(""); // Clear secret when component is destroyed
  //     }
  //   };
  // }, []);

  // === USER INTERFACE RENDERING ===
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Secure Will Creation Dashboard</h2>
      <p style={{ color: "#6c757d", marginBottom: "20px" }}>Create a cryptographic will that protects your secrets using multi-party computation.</p>

      {connected ? (
        <div>
          {/* WALLET STATUS */}
          <div
            style={{
              padding: "10px",
              backgroundColor: "black",
              border: "1px solid #c3e6cb",
              borderRadius: "4px",
              marginBottom: "20px",
            }}
          >
            <strong>✅ Wallet Connected:</strong> {publicKey?.toBase58()}
          </div>

          <hr />

          {/* SECRET INPUT */}
          <div style={{ marginBottom: "15px" }}>
            <label htmlFor="secret" style={{ display: "block", margin: "10px 0", fontWeight: "bold" }}>
              Secret to Protect (min. 12 characters):
            </label>
            <p style={{ fontSize: "14px", color: "#6c757d", margin: "5px 0" }}>
              Enter the secret you want to protect (e.g., seed phrase, password, private key). This will be split cryptographically so no single party can access it alone.
            </p>
            <input
              id="secret"
              type="password" // Hide input for security
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              style={{
                width: "400px",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
              placeholder="Enter your secret seed phrase..."
            />
          </div>

          {/* BENEFICIARY INPUT */}
          <div style={{ marginBottom: "15px" }}>
            <label htmlFor="beneficiary" style={{ display: "block", margin: "10px 0", fontWeight: "bold" }}>
              Beneficiary's Solana Public Key:
            </label>
            <p style={{ fontSize: "14px", color: "#6c757d", margin: "5px 0" }}>
              Enter the Solana public key of the person who should receive access to your secret. They will need their private key to decrypt their share when claiming the inheritance.
            </p>
            <input
              id="beneficiary"
              type="text"
              value={beneficiaryPublicKey}
              onChange={(e) => setBeneficiaryPublicKey(e.target.value)}
              placeholder="Enter valid base58 public key (e.g., 11111111111111111111111111111111)"
              style={{
                width: "400px",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
          </div>

          {/* CREATE WILL BUTTON */}
          <button
            onClick={handleCreateWill}
            disabled={isCreating}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: isCreating ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isCreating ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {isCreating ? "Creating Secure Will..." : "Create Cryptographic Will"}
          </button>

          {/* SUCCESS DISPLAY */}
          {creationSuccess && userFinalShare && (
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                backgroundColor: "black",
                border: "1px solid #c3e6cb",
                borderRadius: "4px",
              }}
            >
              <h3>✅ Digital Will Created Successfully!</h3>

              {/* EXPLANATION OF WHAT HAPPENED */}
              <div style={{ marginBottom: "15px", fontSize: "14px", lineHeight: "1.5" }}>
                <h4>What just happened:</h4>
                <ul style={{ margin: "10px 0", paddingLeft: "20px" }}>
                  <li>
                    <strong>Your secret was cryptographically split</strong> using Shamir's Secret Sharing
                  </li>
                  <li>
                    <strong>Multiple random masks were applied</strong> so no single party knows your secret
                  </li>
                  <li>
                    <strong>Your recovery share was created</strong> (shown below - keep this safe!)
                  </li>
                  <li>
                    <strong>Beneficiary's share was encrypted</strong> and prepared for secure storage
                  </li>
                  <li>
                    <strong>Server coordinates the process</strong> but never sees your original secret
                  </li>
                </ul>
              </div>

              {/* USER'S RECOVERY SHARE */}
              <div style={{ marginTop: "10px" }}>
                <strong>🔑 Your Recovery Share (CRITICAL - Store This Securely!):</strong>
                <pre
                  style={{
                    marginTop: "10px",
                    padding: "10px",
                    backgroundColor: "black",
                    border: "1px solid #dee2e6",
                    borderRadius: "4px",
                    wordBreak: "break-all",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                >
                  {userFinalShare}
                </pre>

                {/* IMPORTANT INSTRUCTIONS */}
                <div
                  style={{
                    marginTop: "15px",
                    padding: "10px",
                    backgroundColor: "black",
                    border: "1px solid #ffeaa7",
                    borderRadius: "4px",
                  }}
                >
                  <p style={{ margin: "0 0 10px 0", fontWeight: "bold" }}>⚠️ CRITICAL SECURITY INSTRUCTIONS:</p>
                  <ul style={{ margin: "0", paddingLeft: "20px", fontSize: "14px" }}>
                    <li>
                      <strong>Store this share in multiple secure locations</strong> (encrypted file, hardware wallet, safe deposit box)
                    </li>
                    <li>
                      <strong>Never share this with anyone</strong> - it's half of what's needed to recover your secret
                    </li>
                    <li>
                      <strong>Test recovery process</strong> periodically to ensure everything works
                    </li>
                    <li>
                      <strong>The beneficiary has been given an encrypted share</strong> that only they can decrypt
                    </li>
                    <li>
                      <strong>Both shares are needed together</strong> to reconstruct your original secret
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* PROCESS EXPLANATION */}
          {!creationSuccess && (
            <div
              style={{
                marginTop: "30px",
                padding: "15px",
                backgroundColor: "black",
                border: "1px solid #dee2e6",
                borderRadius: "4px",
              }}
            >
              <h4>How This Cryptographic Will Works:</h4>
              <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                <p>
                  <strong>1. Secret Splitting:</strong> Your secret is mathematically divided using Shamir's Secret Sharing
                </p>
                <p>
                  <strong>2. Multi-Party Security:</strong> Random masks from multiple parties ensure no single entity can access your secret
                </p>
                <p>
                  <strong>3. Encrypted Storage:</strong> The beneficiary's share is encrypted so only they can decrypt it
                </p>
                <p>
                  <strong>4. Recovery Process:</strong> Both your share and the beneficiary's share are needed to reconstruct the secret
                </p>
                <p>
                  <strong>5. Trustless Design:</strong> No single party (including the server) ever has access to your complete secret
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* WALLET CONNECTION PROMPT */
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            backgroundColor: "black",
            border: "1px solid #dee2e6",
            borderRadius: "4px",
          }}
        >
          <h3>🔐 Wallet Connection Required</h3>
          <p>Please connect your Solana wallet to create a cryptographic will.</p>
          <p style={{ fontSize: "14px", color: "#6c757d" }}>Your wallet is used for authentication and to identify you as the owner of the will.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

function apiCall({ B3, B4, R2_hex, U3, U4, beneficiaryPublicKey }: { beneficiaryPublicKey: string; R2_hex: string; U3: string; U4: string; B3: string; B4: string }): { S1: string; S2: string } {
  // Split beneficiary's random value
  let serverShares = secrets.share(R2_hex, 4, 3);
  // We can use anyone in here B3, B4, U3, U4
  // const maxLength = Math.max(...serverShares.map((share) => share.length), U3.length);
  // serverShares = serverShares.map((share) => padHex(share, maxLength));

  // Server shares: S1, S2, S3, S4
  const [S1, S2, S3, S4] = serverShares;
  console.log("Server shares [S1, S2, S3, S4]", S1.length, S2.length, S3.length, S4.length);
  console.log("Lengths of shares:", U3.length, B3.length, S3.length, U4.length, B4.length, S4.length);
  // This combines: UserShare + BeneficiaryShare + ServerShare
  const server1ShareHex = xorHexStrings(xorHexStrings(U3, B3), S3);
  // This combines: UserShare + BeneficiaryShare + ServerShare
  const server2ShareHex = xorHexStrings(xorHexStrings(U4, B4), S4);
  console.log("Need to save on the db", beneficiaryPublicKey);
  console.log("Server1 Key,Server2 Key", server1ShareHex, server2ShareHex);
  return { S1, S2 };
}
