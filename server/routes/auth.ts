import { RequestHandler } from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev-only";

/**
 * POST /api/auth/login
 * Local database authentication
 */
export const loginHandler: RequestHandler = async (req, res) => {
  try {
    console.log("[Auth] Local login attempt");

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcryptjs.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Update last login
    await db.query(
      "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id],
    );

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.is_admin },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    console.log("[Auth] Login successful for:", email);

    // Return session and user data to match what the client expects
    const responseData = {
      session: {
        access_token: token,
        refresh_token: null, // Local auth doesn't have refresh tokens in this simple impl
        expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 86400,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.is_admin,
        verified: user.verified,
        kycStatus: user.kyc_status,
        created_at: user.created_at,
      },
    };

    res.json(responseData);
  } catch (error) {
    console.error("[Auth] Login handler exception:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * POST /api/auth/register
 * Local database registration
 */
export const registerHandler: RequestHandler = async (req, res) => {
  try {
    console.log("[Auth] Local registration attempt");
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Check if user exists
    const checkResult = await db.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const insertResult = await db.query(
      "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING *",
      [email, hashedPassword, name || ""],
    );

    const user = insertResult.rows[0];
    console.log("[Auth] Registration successful for:", email);

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.is_admin },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    // Return session and user data
    res.status(201).json({
      session: {
        access_token: token,
        refresh_token: null,
        expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 86400,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
      },
      message: "User created successfully.",
    });
  } catch (error) {
    console.error("Register handler error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/auth/session
 * Get current session/user data from JWT
 */
export const getSessionHandler: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      const result = await db.query("SELECT * FROM users WHERE id = $1", [decoded.id]);
      if (result.rows.length === 0) {
        return res.status(401).json({ error: "User not found" });
      }

      const user = result.rows[0];
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.is_admin,
          verified: user.verified,
          kycStatus: user.kyc_status,
          created_at: user.created_at,
        }
      });
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    console.error("[Auth] getSession handler error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * POST /api/auth/logout
 */
export const logoutHandler: RequestHandler = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};

/**
 * POST /api/auth/refresh
 */
export const refreshHandler: RequestHandler = async (req, res) => {
  // Simple implementation: return current session if token is still valid
  // In a real app, we'd use a separate refresh token
  res.status(400).json({ error: "Refresh tokens not supported in local auth fallback" });
};
