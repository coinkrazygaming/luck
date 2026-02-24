import { RequestHandler } from "express";
import crypto from "crypto";
import { db } from "../lib/db";

// Get all active games
export const getAllGames: RequestHandler = async (req, res) => {
  try {
    const gameType = req.query.type as string;

    let query = "SELECT * FROM games WHERE enabled = true";
    const params: any[] = [];

    if (gameType) {
      query += " AND game_id LIKE $1"; // Assuming game_id contains some type info or we match by game_id
      params.push(`%${gameType}%`);
    }

    const result = await db.query(query, params);
    res.json({ games: result.rows });
  } catch (error) {
    console.error("Error fetching games:", error);
    res.status(500).json({ error: "Failed to fetch games" });
  }
};

// Get game by ID
export const getGame: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      "SELECT * FROM games WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.json({ game: result.rows[0] });
  } catch (error) {
    console.error("Error fetching game:", error);
    res.status(500).json({ error: "Failed to fetch game" });
  }
};

// Create game session
export const createGameSession: RequestHandler = async (req, res) => {
  try {
    const { userId, gameId, currency, wagerAmount } = req.body;

    if (!userId || !gameId || !currency || !wagerAmount) {
      return res.status(400).json({
        error: "Missing required fields: userId, gameId, currency, wagerAmount",
      });
    }

    const fieldName = currency === "GC" ? "gold_coins" : "sweep_coins";

    // Use a transaction
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Verify user has sufficient balance
      const balanceResult = await client.query(
        `SELECT ${fieldName} FROM user_balances WHERE user_id = $1 FOR UPDATE`,
        [userId]
      );

      if (balanceResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: "Balance not found" });
      }

      const currentBalance = parseFloat(balanceResult.rows[0][fieldName]);

      if (currentBalance < wagerAmount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Generate session token and seeds
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const serverSeed = crypto.randomBytes(32).toString("hex");

      // Deduct wager from balance
      const newBalance = currentBalance - wagerAmount;
      await client.query(
        `UPDATE user_balances SET ${fieldName} = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
        [newBalance, userId]
      );

      // Record wager transaction
      await client.query(
        `INSERT INTO transactions (user_id, type, currency, amount, description, metadata, created_at)
         VALUES ($1, 'wager', $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [userId, currency, -wagerAmount, `Game wager - ${gameId}`, JSON.stringify({ gameId })]
      );

      // Create game session
      const sessionResult = await client.query(
        `INSERT INTO game_sessions (user_id, game_id, session_token, wager, currency, status, provably_fair_seed, nonce, created_at)
         VALUES ($1, $2, $3, $4, $5, 'active', $6, 0, CURRENT_TIMESTAMP)
         RETURNING *`,
        [userId, gameId, sessionToken, wagerAmount, currency, serverSeed]
      );

      await client.query('COMMIT');

      const session = sessionResult.rows[0];
      res.json({
        session: {
          id: session.id,
          sessionToken,
          serverSeed,
        },
        newBalance,
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating game session:", error);
    res.status(500).json({ error: "Failed to create game session" });
  }
};

// End game session and process win
export const endGameSession: RequestHandler = async (req, res) => {
  try {
    const { sessionId, userId, winAmount, clientSeed } = req.body;

    if (!sessionId || !userId) {
      return res.status(400).json({
        error: "Missing required fields: sessionId, userId",
      });
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Get session
      const sessionResult = await client.query(
        "SELECT * FROM game_sessions WHERE id = $1 FOR UPDATE",
        [sessionId]
      );

      if (sessionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: "Session not found" });
      }

      const session = sessionResult.rows[0];

      if (session.status !== "active") {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: "Session is not active" });
      }

      // Update session
      await client.query(
        `UPDATE game_sessions 
         SET status = 'completed', end_time = CURRENT_TIMESTAMP, win_amount = $1, client_seed = $2, nonce = nonce + 1
         WHERE id = $3`,
        [winAmount || 0, clientSeed, sessionId]
      );

      // Process win if applicable
      if (winAmount && winAmount > 0) {
        const fieldName = session.currency === "GC" ? "gold_coins" : "sweep_coins";
        
        const balanceResult = await client.query(
          `SELECT ${fieldName} FROM user_balances WHERE user_id = $1 FOR UPDATE`,
          [userId]
        );

        const currentBalance = balanceResult.rows.length > 0 ? parseFloat(balanceResult.rows[0][fieldName]) : 0;
        const newBalance = currentBalance + winAmount;

        // Update balance
        await client.query(
          `UPDATE user_balances SET ${fieldName} = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
          [newBalance, userId]
        );

        // Record win transaction
        await client.query(
          `INSERT INTO transactions (user_id, type, currency, amount, description, metadata, created_at)
           VALUES ($1, 'win', $2, $3, 'Game win', $4, CURRENT_TIMESTAMP)`,
          [userId, session.currency, winAmount, JSON.stringify({ gameId: session.game_id })]
        );
      }

      await client.query('COMMIT');
      res.json({ success: true });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error ending game session:", error);
    res.status(500).json({ error: "Failed to end game session" });
  }
};

// Validate game session
export const validateGameSession: RequestHandler = async (req, res) => {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(400).json({ error: "sessionToken is required" });
    }

    const result = await db.query(
      "SELECT * FROM game_sessions WHERE session_token = $1",
      [sessionToken]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    const session = result.rows[0];
    const isValid = session.status === "active";

    res.json({ valid: isValid, session });
  } catch (error) {
    console.error("Error validating session:", error);
    res.status(500).json({ error: "Failed to validate session" });
  }
};
