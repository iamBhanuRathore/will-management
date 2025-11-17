import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import willRoutes from "./routes/willRoutes";
import authRoutes from "./routes/authRoutes";
const app = new Hono();
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.get("/", (c) => {
  return c.json({
    status: "ok",
    message: "Will Management API is running.",
  });
});
app.route("/api/will", willRoutes);
app.route("/api/auth", authRoutes);

export default app;
