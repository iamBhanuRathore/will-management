// src/vercel-entry.ts
import server from "./index.js"; // compiled JS

export const config = {
  api: { bodyParser: false },
};

export default server;
