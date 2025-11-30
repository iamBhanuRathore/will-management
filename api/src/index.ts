import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import willRoutes from "./routes/willRoutes";
import authRoutes from "./routes/authRoutes";
import { envMiddleware } from "./config/env";
import { prismaMiddleware } from "./middleware/prisma";

export type Bindings = {
  DATABASE_URL: string;
  RPC_URL: string;
  [key: string]: any;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middlewares
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allowedOrigins = c.env.ALLOWED_ORIGINS.split(",");
      return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Custom middlewares for env and db
app.use("*", envMiddleware);
app.use("*", prismaMiddleware);

app.get("/", (c) => {
  return c.json({
    status: "ok",
    message: "Will Management API is running.",
  });
});

app.route("/api/will", willRoutes);
app.route("/api/auth", authRoutes);

export default app;
