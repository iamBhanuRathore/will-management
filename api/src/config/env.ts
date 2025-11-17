import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  RPC_URL: z.string().default("8080"),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error("Invalid environment variables.");
  }

  return parsed.data;
}
