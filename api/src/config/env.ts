import { createMiddleware } from "hono/factory";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  RPC_URL: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;

// Extend Hono's context
declare module "hono" {
  interface ContextVariableMap {
    env: Env;
  }
}

export const envMiddleware = createMiddleware(async (c, next) => {
  const parsed = envSchema.safeParse(c.env);

  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.issues);
    return c.json({ success: false, message: "Invalid environment variables." }, 500);
  }

  c.set("env", parsed.data);
  await next();
});
