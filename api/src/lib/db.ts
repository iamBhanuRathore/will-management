import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Context } from "hono";

function createPrismaClient(databaseUrl: string) {
  return new PrismaClient({
    datasourceUrl: databaseUrl,
  }).$extends(withAccelerate());
}
type PrismaClientExtended = ReturnType<typeof createPrismaClient>;

declare global {
  var prisma: PrismaClientExtended | undefined;
}

export const getDb = (c: Context) => {
  const databaseUrl = c.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set in environment");
  }

  if (!globalThis.prisma) {
    globalThis.prisma = createPrismaClient(databaseUrl);
  }
  return globalThis.prisma;
};
