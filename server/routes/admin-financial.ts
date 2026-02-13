import { RequestHandler } from "express";
import { db } from "../lib/db";

interface TransactionRow {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  status: string;
  created_at: string;
}

interface WithdrawalRow {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  processed_at: string;
}

// Initialize financial tables
async function initializeFinancialTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        amount NUMERIC NOT NULL,
        type VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'completed',
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS withdrawals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        amount NUMERIC NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(100),
        bank_details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_balances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE REFERENCES users(id),
        gold_coins NUMERIC DEFAULT 0,
        sweep_coins NUMERIC DEFAULT 0,
        real_money NUMERIC DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
      CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
    `);
  } catch (error) {
    console.error("Error initializing financial tables:", error);
  }
}

export const initFinancialDB = initializeFinancialTables;

// Transaction Management
export const getTransactions: RequestHandler = async (req: any, res) => {
  try {
    const {
      userId,
      type,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = "SELECT * FROM transactions WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      query += ` AND user_id = $${paramIndex++}`;
      params.push(userId);
    }

    if (type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (startDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    res.json({ transactions: result.rows });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

export const getTransactionStats: RequestHandler = async (req: any, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = "";
    const params: any[] = [];

    if (startDate && endDate) {
      dateFilter = " WHERE created_at >= $1 AND created_at <= $2";
      params.push(startDate, endDate);
    }

    const totalResult = await db.query(
      `SELECT COUNT(*) as count, SUM(amount) as total FROM transactions${dateFilter}`,
      params,
    );

    const typeBreakdownResult = await db.query(
      `SELECT type, COUNT(*) as count, SUM(amount) as total FROM transactions${dateFilter} GROUP BY type`,
      params,
    );

    const statusBreakdownResult = await db.query(
      `SELECT status, COUNT(*) as count FROM transactions${dateFilter} GROUP BY status`,
      params,
    );

    res.json({
      stats: {
        totalTransactions: parseInt(totalResult.rows[0].count),
        totalAmount: parseFloat(totalResult.rows[0].total || 0),
        byType: typeBreakdownResult.rows,
        byStatus: statusBreakdownResult.rows,
      },
    });
  } catch (error) {
    console.error("Get transaction stats error:", error);
    res.status(500).json({ error: "Failed to fetch transaction stats" });
  }
};

// Withdrawal Management
export const getWithdrawals: RequestHandler = async (req: any, res) => {
  try {
    const { status = "pending", page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await db.query(
      `SELECT w.*, u.email, u.name FROM withdrawals w
       JOIN users u ON w.user_id = u.id
       WHERE w.status = $1
       ORDER BY w.created_at DESC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset],
    );

    res.json({ withdrawals: result.rows });
  } catch (error) {
    console.error("Get withdrawals error:", error);
    res.status(500).json({ error: "Failed to fetch withdrawals" });
  }
};

export const approveWithdrawal: RequestHandler = async (req: any, res) => {
  try {
    const { withdrawalId } = req.params;

    const result = await db.query(
      `UPDATE withdrawals 
       SET status = 'approved', processed_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [withdrawalId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Withdrawal not found" });
    }

    // Create transaction record
    const withdrawal = result.rows[0];
    await db.query(
      `INSERT INTO transactions (user_id, amount, type, description, status)
       VALUES ($1, $2, 'withdrawal', 'Approved withdrawal', 'completed')`,
      [withdrawal.user_id, -withdrawal.amount],
    );

    res.json({ withdrawal: result.rows[0] });
  } catch (error) {
    console.error("Approve withdrawal error:", error);
    res.status(500).json({ error: "Failed to approve withdrawal" });
  }
};

export const rejectWithdrawal: RequestHandler = async (req: any, res) => {
  try {
    const { withdrawalId } = req.params;
    const { reason } = req.body;

    const result = await db.query(
      `UPDATE withdrawals 
       SET status = 'rejected', processed_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [withdrawalId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Withdrawal not found" });
    }

    res.json({ withdrawal: result.rows[0] });
  } catch (error) {
    console.error("Reject withdrawal error:", error);
    res.status(500).json({ error: "Failed to reject withdrawal" });
  }
};

export const getWithdrawalStats: RequestHandler = async (req: any, res) => {
  try {
    const pendingResult = await db.query(
      "SELECT COUNT(*) as count, SUM(amount) as total FROM withdrawals WHERE status = 'pending'",
    );

    const approvedResult = await db.query(
      "SELECT COUNT(*) as count, SUM(amount) as total FROM withdrawals WHERE status = 'approved'",
    );

    const rejectedResult = await db.query(
      "SELECT COUNT(*) as count FROM withdrawals WHERE status = 'rejected'",
    );

    res.json({
      stats: {
        pending: {
          count: parseInt(pendingResult.rows[0].count),
          total: parseFloat(pendingResult.rows[0].total || 0),
        },
        approved: {
          count: parseInt(approvedResult.rows[0].count),
          total: parseFloat(approvedResult.rows[0].total || 0),
        },
        rejected: {
          count: parseInt(rejectedResult.rows[0].count),
        },
      },
    });
  } catch (error) {
    console.error("Get withdrawal stats error:", error);
    res.status(500).json({ error: "Failed to fetch withdrawal stats" });
  }
};

// User Balance Management
export const getUserBalance: RequestHandler = async (req: any, res) => {
  try {
    const { userId } = req.params;

    let result = await db.query(
      "SELECT * FROM user_balances WHERE user_id = $1",
      [userId],
    );

    if (result.rows.length === 0) {
      // Create balance record if it doesn't exist
      await db.query(
        `INSERT INTO user_balances (user_id, gold_coins, sweep_coins, real_money)
         VALUES ($1, 0, 0, 0)`,
        [userId],
      );

      result = await db.query(
        "SELECT * FROM user_balances WHERE user_id = $1",
        [userId],
      );
    }

    res.json({ balance: result.rows[0] });
  } catch (error) {
    console.error("Get user balance error:", error);
    res.status(500).json({ error: "Failed to fetch user balance" });
  }
};

export const updateUserBalance: RequestHandler = async (req: any, res) => {
  try {
    const { userId } = req.params;
    const { goldCoins, sweepCoins, realMoney } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (goldCoins !== undefined) {
      updates.push(`gold_coins = gold_coins + $${paramIndex++}`);
      values.push(goldCoins);
    }

    if (sweepCoins !== undefined) {
      updates.push(`sweep_coins = sweep_coins + $${paramIndex++}`);
      values.push(sweepCoins);
    }

    if (realMoney !== undefined) {
      updates.push(`real_money = real_money + $${paramIndex++}`);
      values.push(realMoney);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      return res.status(400).json({ error: "No balance fields to update" });
    }

    values.push(userId);
    const query = `UPDATE user_balances SET ${updates.join(", ")} WHERE user_id = $${paramIndex} RETURNING *`;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Record transaction
    const totalChange = (goldCoins || 0) + (sweepCoins || 0) + (realMoney || 0);
    if (totalChange !== 0) {
      await db.query(
        `INSERT INTO transactions (user_id, amount, type, description)
         VALUES ($1, $2, 'admin_adjustment', 'Admin balance adjustment')`,
        [userId, totalChange],
      );
    }

    res.json({ balance: result.rows[0] });
  } catch (error) {
    console.error("Update user balance error:", error);
    res.status(500).json({ error: "Failed to update user balance" });
  }
};

// Revenue Reports
export const getRevenueReport: RequestHandler = async (req: any, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = "";
    const params: any[] = [];

    if (startDate && endDate) {
      dateFilter = " WHERE created_at >= $1 AND created_at <= $2";
      params.push(startDate, endDate);
    }

    // Total revenue from losses
    const revenueResult = await db.query(
      `SELECT SUM(amount) as total FROM transactions 
       WHERE type = 'loss'${dateFilter ? " AND " + dateFilter.substring(7) : ""}`,
      params,
    );

    // Payouts
    const payoutsResult = await db.query(
      `SELECT SUM(amount) as total FROM transactions 
       WHERE type IN ('withdrawal', 'payout')${dateFilter ? " AND " + dateFilter.substring(7) : ""}`,
      params,
    );

    // Bonuses given
    const bonusesResult = await db.query(
      `SELECT SUM(amount) as total FROM transactions 
       WHERE type = 'bonus'${dateFilter ? " AND " + dateFilter.substring(7) : ""}`,
      params,
    );

    const revenue = parseFloat(revenueResult.rows[0].total || 0);
    const payouts = Math.abs(parseFloat(payoutsResult.rows[0].total || 0));
    const bonuses = parseFloat(bonusesResult.rows[0].total || 0);
    const netRevenue = revenue - payouts - bonuses;

    res.json({
      report: {
        revenue,
        payouts,
        bonuses,
        netRevenue,
        margin: revenue > 0 ? (netRevenue / revenue) * 100 : 0,
      },
    });
  } catch (error) {
    console.error("Get revenue report error:", error);
    res.status(500).json({ error: "Failed to generate revenue report" });
  }
};

export const getFinancialSummary: RequestHandler = async (req: any, res) => {
  try {
    const totalUsersResult = await db.query(
      "SELECT COUNT(*) as count FROM users",
    );
    const totalBalanceResult = await db.query(
      "SELECT SUM(gold_coins + sweep_coins + real_money) as total FROM user_balances",
    );
    const pendingWithdrawalsResult = await db.query(
      "SELECT SUM(amount) as total FROM withdrawals WHERE status = 'pending'",
    );

    res.json({
      summary: {
        totalUsers: parseInt(totalUsersResult.rows[0].count),
        totalBalance: parseFloat(totalBalanceResult.rows[0].total || 0),
        pendingWithdrawals: parseFloat(
          pendingWithdrawalsResult.rows[0].total || 0,
        ),
      },
    });
  } catch (error) {
    console.error("Get financial summary error:", error);
    res.status(500).json({ error: "Failed to fetch financial summary" });
  }
};
