import { Keypair } from '@solana/web3.js';

// Your Base64 keypair string
const keypairBase64 = 'nFKOFDjTXu8vEIHQryAnDZw3iW189SzLntf9OsMwghAhSt+ibFy8Lbsh/+iq/ltl8nVeZ7s3CYjNXOyP1H9P+w==';

// 1. Decode from Base64 to a Uint8Array (64 bytes)
const keypairBytes = Buffer.from(keypairBase64, 'base64');
console.log('Keypair Bytes (64 bytes):', keypairBytes);

// 2. Extract the first 32 bytes as the private key
const privateKeyBytes = keypairBytes.slice(0, 32);
console.log('Private Key Bytes (32 bytes):', privateKeyBytes);

// 3. Create a Keypair instance and get the Base58 private key
const keypair = Keypair.fromSecretKey(privateKeyBytes);
const privateKeyBase58 = keypair.secretKey.toBase58();

console.log('---------------------------------');
console.log('Public Key:', keypair.publicKey.toBase58());
console.log('Private Key:', privateKeyBase58);

// To verify, you can also check the public key part
const publicKeyBytes = keypairBytes.slice(32);
const publicKey = new PublicKey(publicKeyBytes);
console.log('Public Key (from second 32 bytes):', publicKey.toBase58());