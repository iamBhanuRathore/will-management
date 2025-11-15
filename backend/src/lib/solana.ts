import { clusterApiUrl, Connection, type Cluster } from "@solana/web3.js";

// Configuration constants
const NETWORK: Cluster = "devnet";
export const getSolanaConnection = (): Connection => {
  const endpoint = process.env.RPC_URL || clusterApiUrl(NETWORK);
  return new Connection(endpoint, {
    commitment: "confirmed",
    // Disable WS → no reconnect spam in console
    wsEndpoint: undefined,
    // Optional: add a short timeout so failed HTTP calls don’t hang forever
    // fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(30_000) }),
  });
};

// Export the instance (lazy-initialized)
let _connection: Connection | null = null;
export const solanaConnection = (): Connection => {
  if (!_connection) _connection = getSolanaConnection();
  return _connection;
};
