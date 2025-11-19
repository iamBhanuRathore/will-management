import { createMiddleware } from "hono/factory";

// Extend Hono's context to include the user
declare module "hono" {
  interface ContextVariableMap {
    user: {
      address: string;
    };
  }
}

export const protect = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return c.json({ success: false, message: "Not authorized, no token" }, 401);
  }

  try {
    const prisma = c.get("prisma");
    const user = await prisma.user.findFirst({
      where: {
        sessionToken: token,
        sessionTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return c.json({ success: false, message: "Not authorized, token failed" }, 401);
    }

    c.set("user", { address: user.address });
    await next();
  } catch (error) {
    console.error("Authorization error:", error);
    return c.json({ success: false, message: "Authorization failed" }, 401);
  }
});

