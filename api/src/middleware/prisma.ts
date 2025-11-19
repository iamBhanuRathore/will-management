import { createMiddleware } from "hono/factory";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

const createPrismaClient = (databaseUrl: string) => {
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  }).$extends(withAccelerate());
};

export type PrismaClientExtended = ReturnType<typeof createPrismaClient>;

declare module "hono" {
  interface ContextVariableMap {
    prisma: PrismaClientExtended;
  }
}

export const prismaMiddleware = createMiddleware(async (c, next) => {
  const env = c.get("env");
  if (!env) {
    // This should not happen if envMiddleware is applied globally before this.
    throw new Error("Environment variables are not available.");
  }
  const prisma = createPrismaClient(env.DATABASE_URL);
  c.set("prisma", prisma);
  await next();
});
