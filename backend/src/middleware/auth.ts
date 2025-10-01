import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/db";

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }

  try {
    // Find the user by the session token and ensure it has not expired.
    const user = await prisma.user.findFirst({
      where: {
        sessionToken: token,
        sessionTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }

    // Attach user to the request object
    req.user = { id: user.id, address: user.address };
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
};
