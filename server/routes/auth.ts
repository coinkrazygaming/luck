import { RequestHandler } from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../lib/db";

const JWT_SECRET =
  process.env.JWT_SECRET || "dev-secret-key-change-in-production";

interface AuthRequest {
  email: string;
  password: string;
  name?: string;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  verified: boolean;
  kyc_status: string;
  created_at: string;
  last_login_at: string;
  total_losses: number;
  jackpot_opt_in: boolean;
  password_hash: string;
}

function mapUserRow(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    isAdmin: row.is_admin,
    verified: row.verified,
    kycStatus: row.kyc_status,
    createdAt: new Date(row.created_at),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : null,
    totalLosses: Number(row.total_losses),
    jackpotOptIn: row.jackpot_opt_in,
  };
}

export const register: RequestHandler = async (req, res) => {
  try {
    const { email, password, name } = req.body as AuthRequest;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const result = await db.query(
      "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, is_admin, verified, kyc_status, created_at, last_login_at, total_losses, jackpot_opt_in",
      [email, hashedPassword, name || ""],
    );

    const user = result.rows[0] as UserRow;
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ user: mapUserRow(user), token });
  } catch (error: any) {
    if (error.code === "23505") {
      // Unique violation
      return res.status(400).json({ error: "Email already exists" });
    }
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body as AuthRequest;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const result = await db.query(
      "SELECT id, email, name, is_admin, verified, kyc_status, created_at, last_login_at, total_losses, jackpot_opt_in, password_hash FROM users WHERE email = $1",
      [email],
    );

    const user = result.rows[0] as UserRow | undefined;

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcryptjs.compare(
      password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    await db.query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [
      user.id,
    ]);

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ user: mapUserRow(user), token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

export const getSession: RequestHandler = async (req, res) => {
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

    const result = await db.query(
      `SELECT id, email, name, is_admin, verified, kyc_status, 
              created_at, last_login_at, total_losses, jackpot_opt_in 
       FROM users WHERE id = $1`,
      [payload.id],
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0] as UserRow;
    res.json({ user: mapUserRow(user) });
  } catch (error) {
    console.error("Session error:", error);
    res.status(500).json({ error: "Session verification failed" });
  }
};

export const logout: RequestHandler = (_req, res) => {
  res.json({ message: "Logged out successfully" });
};

export const updateProfile: RequestHandler = async (req, res) => {
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

    const updates = req.body;
    const allowedFields = [
      "name",
      "verified",
      "kyc_status",
      "kyc_documents",
      "total_losses",
      "jackpot_opt_in",
    ];

    const updateQuery = Object.keys(updates)
      .filter((key) => allowedFields.includes(key))
      .map((key, index) => {
        const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        return `${snakeKey} = $${index + 2}`;
      })
      .join(", ");

    if (!updateQuery) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const values = Object.keys(updates)
      .filter((key) => allowedFields.includes(key))
      .map((key) => updates[key]);

    const result = await db.query(
      `UPDATE users SET ${updateQuery} WHERE id = $1 RETURNING id, email, name, is_admin, verified, kyc_status, created_at, last_login_at, total_losses, jackpot_opt_in`,
      [payload.id, ...values],
    );

    const user = result.rows[0] as UserRow;
    res.json({ user: mapUserRow(user) });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};
