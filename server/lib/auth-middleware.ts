import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "./db";

const JWT_SECRET =
  process.env.JWT_SECRET || "dev-secret-key-change-in-production";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    isAdmin?: boolean;
  };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Fetch user from DB to get current is_admin status
    const result = await db.query(
      "SELECT id, email, is_admin FROM users WHERE id = $1",
      [payload.id],
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }

    req.user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      isAdmin: result.rows[0].is_admin,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}

export function adminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}

// Combine auth + admin check
export const requireAdmin = [authMiddleware, adminOnly];
