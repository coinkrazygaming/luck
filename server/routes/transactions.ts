import { RequestHandler } from "express";
import { db } from "../lib/db";

// Get user transactions
export const getUserTransactions: RequestHandler = async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const limit = parseInt(req.query.limit as string) || 100;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const result = await db.query(
      "SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2",
      [userId, limit]
    );

    res.json({ transactions: result.rows });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

// Get user balance
export const getUserBalance: RequestHandler = async (req, res) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    let result = await db.query(
      "SELECT * FROM user_balances WHERE user_id = $1",
      [userId]
    );

    // If no balance record exists, create one
    if (result.rows.length === 0) {
      const insertResult = await db.query(
        `INSERT INTO user_balances (user_id, gold_coins, sweep_coins)
         VALUES ($1, 10000, 10)
         RETURNING *`,
        [userId]
      );
      
      const newBalance = insertResult.rows[0];
      return res.json({
        balance: {
          goldCoins: parseFloat(newBalance.gold_coins),
          sweepCoins: parseFloat(newBalance.sweep_coins),
          bonusCoins: 0,
        },
      });
    }

    const data = result.rows[0];
    res.json({
      balance: {
        goldCoins: parseFloat(data.gold_coins),
        sweepCoins: parseFloat(data.sweep_coins),
        bonusCoins: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
};

// Record transaction
export const recordTransaction: RequestHandler = async (req, res) => {
  try {
    const { userId, type, currency, amount, description, gameType } = req.body;

    if (!userId || !type || !currency || amount === undefined) {
      return res.status(400).json({
        error: "Missing required fields: userId, type, currency, amount",
      });
    }

    const field = currency === "GC" ? "gold_coins" : "sweep_coins";

    // Get current balance and update in a transaction
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      const balanceResult = await client.query(
        `SELECT ${field} FROM user_balances WHERE user_id = $1 FOR UPDATE`,
        [userId]
      );

      let currentBalance = 0;
      if (balanceResult.rows.length > 0) {
        currentBalance = parseFloat(balanceResult.rows[0][field]);
      } else {
        // Create balance if it doesn't exist
        await client.query(
          `INSERT INTO user_balances (user_id, gold_coins, sweep_coins) VALUES ($1, 0, 0)`,
          [userId]
        );
      }

      const newBalance = Math.max(0, currentBalance + amount);

      // Update balance
      await client.query(
        `UPDATE user_balances SET ${field} = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
        [newBalance, userId]
      );

      // Record transaction
      const transactionResult = await client.query(
        `INSERT INTO transactions (user_id, type, currency, amount, description, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
         RETURNING *`,
        [userId, type, currency, amount, description, JSON.stringify({ gameType })]
      );

      await client.query('COMMIT');

      res.json({
        transaction: transactionResult.rows[0],
        newBalance,
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error recording transaction:", error);
    res.status(500).json({ error: "Failed to record transaction" });
  }
};
