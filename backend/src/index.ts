// src/index.ts
import express from "express";
import cors from "cors";
// import helmet from "helmet";
import dotenv from "dotenv";
import willRoutes from "./routes/willRoutes.ts";
import authRoutes from "./routes/authRoutes.ts";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
// app.use(helmet()); // Set various security HTTP headers
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// --- Routes ---
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Will Management API is running." });
});

// Mount the will-related routes
app.use("/api/will", willRoutes);
app.use("/api/auth", authRoutes);
// --- Start Server ---
// Vercel will handle the listening part, so we only listen locally
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Express server is running at http://localhost:${PORT}`);
  });
}

export default app;
