import { RequestHandler } from "express";
import { db } from "../lib/db";

interface GameRow {
  id: string;
  provider_id: string;
  game_id: string;
  name: string;
  description: string;
  enabled: boolean;
  created_at: string;
}

interface ProviderRow {
  id: string;
  name: string;
  enabled: boolean;
  type: string;
  config: any;
  created_at: string;
}

// Initialize games table if it doesn't exist
async function initializeGamesTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS providers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        enabled BOOLEAN DEFAULT true,
        type VARCHAR(100) NOT NULL,
        config JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS games (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        provider_id UUID REFERENCES providers(id),
        game_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS game_blacklist (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        game_id VARCHAR(255) NOT NULL,
        provider_id UUID,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS game_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        game_id VARCHAR(255) NOT NULL,
        session_token VARCHAR(255) NOT NULL,
        wager NUMERIC NOT NULL,
        currency VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        provably_fair_seed TEXT,
        client_seed TEXT,
        nonce INTEGER DEFAULT 0,
        win_amount NUMERIC DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP
      );
    `);
  } catch (error) {
    console.error("Error initializing games tables:", error);
  }
}

export const initGamesDB = initializeGamesTables;

// Provider Management
export const getProviders: RequestHandler = async (req: any, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM providers ORDER BY created_at DESC",
    );
    res.json({ providers: result.rows });
  } catch (error) {
    console.error("Get providers error:", error);
    res.status(500).json({ error: "Failed to fetch providers" });
  }
};

export const createProvider: RequestHandler = async (req: any, res) => {
  try {
    const { name, type, config } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: "Name and type are required" });
    }

    const result = await db.query(
      "INSERT INTO providers (name, type, config) VALUES ($1, $2, $3) RETURNING *",
      [name, type, config || {}],
    );

    res.json({ provider: result.rows[0] });
  } catch (error) {
    console.error("Create provider error:", error);
    res.status(500).json({ error: "Failed to create provider" });
  }
};

export const updateProvider: RequestHandler = async (req: any, res) => {
  try {
    const { providerId } = req.params;
    const { name, enabled, config } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (enabled !== undefined) {
      updates.push(`enabled = $${paramIndex++}`);
      values.push(enabled);
    }
    if (config !== undefined) {
      updates.push(`config = $${paramIndex++}`);
      values.push(JSON.stringify(config));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(providerId);
    const query = `UPDATE providers SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`;

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Provider not found" });
    }

    res.json({ provider: result.rows[0] });
  } catch (error) {
    console.error("Update provider error:", error);
    res.status(500).json({ error: "Failed to update provider" });
  }
};

export const deleteProvider: RequestHandler = async (req: any, res) => {
  try {
    const { providerId } = req.params;

    await db.query("DELETE FROM providers WHERE id = $1", [providerId]);
    res.json({ success: true, message: "Provider deleted" });
  } catch (error) {
    console.error("Delete provider error:", error);
    res.status(500).json({ error: "Failed to delete provider" });
  }
};

// Game Management
export const getGames: RequestHandler = async (req: any, res) => {
  try {
    const { providerId, search } = req.query;

    let query = `
      SELECT g.*, p.name as provider_name FROM games g
      LEFT JOIN providers p ON g.provider_id = p.id
    `;
    const params: any[] = [];

    if (providerId) {
      query += " WHERE g.provider_id = $1";
      params.push(providerId);
    }

    if (search) {
      const searchParam = `%${search}%`;
      query += params.length
        ? " AND (g.name ILIKE $2 OR g.game_id ILIKE $2)"
        : " WHERE (g.name ILIKE $1 OR g.game_id ILIKE $1)";
      params.push(searchParam);
    }

    query += " ORDER BY g.created_at DESC";

    const result = await db.query(query, params);
    res.json({ games: result.rows });
  } catch (error) {
    console.error("Get games error:", error);
    res.status(500).json({ error: "Failed to fetch games" });
  }
};

export const createGame: RequestHandler = async (req: any, res) => {
  try {
    const { providerId, gameId, name, description } = req.body;

    if (!providerId || !gameId || !name) {
      return res
        .status(400)
        .json({ error: "Provider ID, game ID, and name are required" });
    }

    const result = await db.query(
      "INSERT INTO games (provider_id, game_id, name, description) VALUES ($1, $2, $3, $4) RETURNING *",
      [providerId, gameId, name, description || ""],
    );

    res.json({ game: result.rows[0] });
  } catch (error) {
    console.error("Create game error:", error);
    res.status(500).json({ error: "Failed to create game" });
  }
};

export const updateGame: RequestHandler = async (req: any, res) => {
  try {
    const { gameId } = req.params;
    const { name, description, enabled } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (enabled !== undefined) {
      updates.push(`enabled = $${paramIndex++}`);
      values.push(enabled);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(gameId);
    const query = `UPDATE games SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`;

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.json({ game: result.rows[0] });
  } catch (error) {
    console.error("Update game error:", error);
    res.status(500).json({ error: "Failed to update game" });
  }
};

export const deleteGame: RequestHandler = async (req: any, res) => {
  try {
    const { gameId } = req.params;

    await db.query("DELETE FROM games WHERE id = $1", [gameId]);
    res.json({ success: true, message: "Game deleted" });
  } catch (error) {
    console.error("Delete game error:", error);
    res.status(500).json({ error: "Failed to delete game" });
  }
};

// Game Blacklist
export const getBlacklist: RequestHandler = async (req: any, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM game_blacklist ORDER BY created_at DESC",
    );
    res.json({ blacklist: result.rows });
  } catch (error) {
    console.error("Get blacklist error:", error);
    res.status(500).json({ error: "Failed to fetch blacklist" });
  }
};

export const addToBlacklist: RequestHandler = async (req: any, res) => {
  try {
    const { gameId, providerId, reason } = req.body;

    if (!gameId) {
      return res.status(400).json({ error: "Game ID is required" });
    }

    const result = await db.query(
      "INSERT INTO game_blacklist (game_id, provider_id, reason) VALUES ($1, $2, $3) RETURNING *",
      [gameId, providerId || null, reason || ""],
    );

    res.json({ blacklistEntry: result.rows[0] });
  } catch (error) {
    console.error("Add to blacklist error:", error);
    res.status(500).json({ error: "Failed to add to blacklist" });
  }
};

export const removeFromBlacklist: RequestHandler = async (req: any, res) => {
  try {
    const { blacklistId } = req.params;

    await db.query("DELETE FROM game_blacklist WHERE id = $1", [blacklistId]);
    res.json({ success: true, message: "Removed from blacklist" });
  } catch (error) {
    console.error("Remove from blacklist error:", error);
    res.status(500).json({ error: "Failed to remove from blacklist" });
  }
};

// Game Statistics
export const getGameStats: RequestHandler = async (req: any, res) => {
  try {
    const totalGamesResult = await db.query(
      "SELECT COUNT(*) as count FROM games",
    );
    const enabledGamesResult = await db.query(
      "SELECT COUNT(*) as count FROM games WHERE enabled = true",
    );
    const providersResult = await db.query(
      "SELECT COUNT(*) as count FROM providers",
    );

    res.json({
      stats: {
        totalGames: parseInt(totalGamesResult.rows[0].count),
        enabledGames: parseInt(enabledGamesResult.rows[0].count),
        totalProviders: parseInt(providersResult.rows[0].count),
      },
    });
  } catch (error) {
    console.error("Get game stats error:", error);
    res.status(500).json({ error: "Failed to fetch game stats" });
  }
};
