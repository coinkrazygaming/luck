import { RequestHandler } from "express";
import { db } from "../lib/db";

interface AuthRequest {
  user?: {
    id: string;
    email: string;
    isAdmin?: boolean;
  };
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
}

interface TransactionRow {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
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

// User Management
export const getAllUsers: RequestHandler = async (req: any, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query =
      "SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2";
    let params: any[] = [limit, offset];

    if (search) {
      query =
        "SELECT * FROM users WHERE email ILIKE $1 OR name ILIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3";
      params = [`%${search}%`, limit, offset];
    }

    const result = await db.query(query, params);
    const users = result.rows.map((row) => mapUserRow(row as UserRow));
    res.json({ users, total: result.rows.length });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const getUserById: RequestHandler = async (req: any, res) => {
  try {
    const { userId } = req.params;
    const result = await db.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);

    if (!result.rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = mapUserRow(result.rows[0] as UserRow);
    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

export const updateUser: RequestHandler = async (req: any, res) => {
  try {
    const { userId } = req.params;
    const { name, verified, kycStatus, jackpotOptIn, isAdmin } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (verified !== undefined) {
      updates.push(`verified = $${paramIndex++}`);
      values.push(verified);
    }
    if (kycStatus !== undefined) {
      updates.push(`kyc_status = $${paramIndex++}`);
      values.push(kycStatus);
    }
    if (jackpotOptIn !== undefined) {
      updates.push(`jackpot_opt_in = $${paramIndex++}`);
      values.push(jackpotOptIn);
    }
    if (isAdmin !== undefined) {
      updates.push(`is_admin = $${paramIndex++}`);
      values.push(isAdmin);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(userId);
    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`;

    const result = await db.query(query, values);
    const user = mapUserRow(result.rows[0] as UserRow);
    res.json(user);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
};

export const deleteUser: RequestHandler = async (req: any, res) => {
  try {
    const { userId } = req.params;

    // Prevent deleting self
    if (userId === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    await db.query("DELETE FROM users WHERE id = $1", [userId]);
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// Statistics & Analytics
export const getAdminStats: RequestHandler = async (req: any, res) => {
  try {
    // Total users
    const usersResult = await db.query("SELECT COUNT(*) as count FROM users");
    const totalUsers = parseInt(usersResult.rows[0].count);

    // Verified users
    const verifiedResult = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE verified = true",
    );
    const verifiedUsers = parseInt(verifiedResult.rows[0].count);

    // Admin users
    const adminsResult = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE is_admin = true",
    );
    const adminCount = parseInt(adminsResult.rows[0].count);

    res.json({
      totalUsers,
      verifiedUsers,
      adminCount,
      unverifiedUsers: totalUsers - verifiedUsers,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

export const getUserStats: RequestHandler = async (req: any, res) => {
  try {
    const { userId } = req.params;

    const result = await db.query(
      "SELECT id, email, created_at, last_login_at, total_losses FROM users WHERE id = $1",
      [userId],
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];
    res.json({
      userId: user.id,
      email: user.email,
      createdAt: new Date(user.created_at),
      lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : null,
      totalLosses: Number(user.total_losses),
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({ error: "Failed to fetch user stats" });
  }
};

// System Management
export const getSystemStatus: RequestHandler = async (req: any, res) => {
  try {
    const dbCheck = await db.query("SELECT NOW() as timestamp");
    res.json({
      status: "operational",
      database: "connected",
      timestamp: dbCheck.rows[0].timestamp,
      uptime: process.uptime(),
    });
  } catch (error) {
    console.error("System status error:", error);
    res.status(503).json({ error: "System check failed" });
  }
};

export const getDashboardData: RequestHandler = async (req: any, res) => {
  try {
    // Get all key metrics
    const usersResult = await db.query("SELECT COUNT(*) as count FROM users");
    const totalUsers = parseInt(usersResult.rows[0].count);

    const verifiedResult = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE verified = true",
    );
    const verifiedUsers = parseInt(verifiedResult.rows[0].count);

    const todayUsersResult = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - INTERVAL '1 day'",
    );
    const newUsersToday = parseInt(todayUsersResult.rows[0].count);

    const activeSessionsResult = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE last_login_at > NOW() - INTERVAL '24 hours'",
    );
    const activeUsers = parseInt(activeSessionsResult.rows[0].count);

    const recentUsersResult = await db.query(
      "SELECT id, email, name, created_at, verified FROM users ORDER BY created_at DESC LIMIT 10",
    );

    res.json({
      summary: {
        totalUsers,
        verifiedUsers,
        newUsersToday,
        activeUsers,
      },
      recentUsers: recentUsersResult.rows,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};
