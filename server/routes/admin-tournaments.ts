import { RequestHandler } from "express";
import { db } from "../lib/db";

// Initialize tournaments table
async function initializeTournamentsTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        entry_fee NUMERIC DEFAULT 0,
        prize_pool NUMERIC DEFAULT 0,
        max_participants INTEGER,
        current_participants INTEGER DEFAULT 0,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tournament_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tournament_id UUID REFERENCES tournaments(id),
        user_id UUID REFERENCES users(id),
        score NUMERIC DEFAULT 0,
        rank INTEGER,
        paid BOOLEAN DEFAULT false,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tournament_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS tournament_leaderboard (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tournament_id UUID REFERENCES tournaments(id),
        user_id UUID REFERENCES users(id),
        rank INTEGER,
        score NUMERIC,
        prize NUMERIC,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
      CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament_id ON tournament_participants(tournament_id);
      CREATE INDEX IF NOT EXISTS idx_tournament_leaderboard_tournament_id ON tournament_leaderboard(tournament_id);
    `);
  } catch (error) {
    console.error("Error initializing tournaments tables:", error);
  }
}

export const initTournamentsDB = initializeTournamentsTables;

// Tournament Management
export const getAllTournaments: RequestHandler = async (req: any, res) => {
  try {
    const { status, type, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = "SELECT * FROM tournaments WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    res.json({ tournaments: result.rows });
  } catch (error) {
    console.error("Get tournaments error:", error);
    res.status(500).json({ error: "Failed to fetch tournaments" });
  }
};

export const getTournamentDetails: RequestHandler = async (req: any, res) => {
  try {
    const { tournamentId } = req.params;

    const tournamentResult = await db.query(
      "SELECT * FROM tournaments WHERE id = $1",
      [tournamentId],
    );

    if (!tournamentResult.rows[0]) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    const participantsResult = await db.query(
      `SELECT tp.*, u.name, u.email FROM tournament_participants tp
       JOIN users u ON tp.user_id = u.id
       WHERE tp.tournament_id = $1
       ORDER BY tp.rank ASC`,
      [tournamentId],
    );

    const leaderboardResult = await db.query(
      `SELECT tl.*, u.name, u.email FROM tournament_leaderboard tl
       JOIN users u ON tl.user_id = u.id
       WHERE tl.tournament_id = $1
       ORDER BY tl.rank ASC`,
      [tournamentId],
    );

    res.json({
      tournament: tournamentResult.rows[0],
      participants: participantsResult.rows,
      leaderboard: leaderboardResult.rows,
    });
  } catch (error) {
    console.error("Get tournament details error:", error);
    res.status(500).json({ error: "Failed to fetch tournament details" });
  }
};

export const createTournament: RequestHandler = async (req: any, res) => {
  try {
    const {
      name,
      description,
      type,
      startDate,
      endDate,
      entryFee,
      prizePool,
      maxParticipants,
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: "Name and type are required" });
    }

    const result = await db.query(
      `INSERT INTO tournaments (name, description, type, start_date, end_date, entry_fee, prize_pool, max_participants, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        name,
        description || "",
        type,
        startDate,
        endDate,
        entryFee || 0,
        prizePool || 0,
        maxParticipants,
        req.user.id,
      ],
    );

    res.json({ tournament: result.rows[0] });
  } catch (error) {
    console.error("Create tournament error:", error);
    res.status(500).json({ error: "Failed to create tournament" });
  }
};

export const updateTournament: RequestHandler = async (req: any, res) => {
  try {
    const { tournamentId } = req.params;
    const {
      name,
      description,
      status,
      startDate,
      endDate,
      prizePool,
      maxParticipants,
    } = req.body;

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
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (startDate !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      values.push(startDate);
    }
    if (endDate !== undefined) {
      updates.push(`end_date = $${paramIndex++}`);
      values.push(endDate);
    }
    if (prizePool !== undefined) {
      updates.push(`prize_pool = $${paramIndex++}`);
      values.push(prizePool);
    }
    if (maxParticipants !== undefined) {
      updates.push(`max_participants = $${paramIndex++}`);
      values.push(maxParticipants);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(tournamentId);
    const query = `UPDATE tournaments SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    res.json({ tournament: result.rows[0] });
  } catch (error) {
    console.error("Update tournament error:", error);
    res.status(500).json({ error: "Failed to update tournament" });
  }
};

export const deleteTournament: RequestHandler = async (req: any, res) => {
  try {
    const { tournamentId } = req.params;

    // Delete related records
    await db.query(
      "DELETE FROM tournament_leaderboard WHERE tournament_id = $1",
      [tournamentId],
    );
    await db.query(
      "DELETE FROM tournament_participants WHERE tournament_id = $1",
      [tournamentId],
    );
    await db.query("DELETE FROM tournaments WHERE id = $1", [tournamentId]);

    res.json({ success: true, message: "Tournament deleted" });
  } catch (error) {
    console.error("Delete tournament error:", error);
    res.status(500).json({ error: "Failed to delete tournament" });
  }
};

// Tournament Status Management
export const startTournament: RequestHandler = async (req: any, res) => {
  try {
    const { tournamentId } = req.params;

    const result = await db.query(
      `UPDATE tournaments SET status = 'active', start_date = NOW() WHERE id = $1 RETURNING *`,
      [tournamentId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    res.json({ tournament: result.rows[0] });
  } catch (error) {
    console.error("Start tournament error:", error);
    res.status(500).json({ error: "Failed to start tournament" });
  }
};

export const endTournament: RequestHandler = async (req: any, res) => {
  try {
    const { tournamentId } = req.params;

    const result = await db.query(
      `UPDATE tournaments SET status = 'completed', end_date = NOW() WHERE id = $1 RETURNING *`,
      [tournamentId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    res.json({ tournament: result.rows[0] });
  } catch (error) {
    console.error("End tournament error:", error);
    res.status(500).json({ error: "Failed to end tournament" });
  }
};

export const cancelTournament: RequestHandler = async (req: any, res) => {
  try {
    const { tournamentId } = req.params;

    const result = await db.query(
      `UPDATE tournaments SET status = 'cancelled', end_date = NOW() WHERE id = $1 RETURNING *`,
      [tournamentId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    res.json({ tournament: result.rows[0] });
  } catch (error) {
    console.error("Cancel tournament error:", error);
    res.status(500).json({ error: "Failed to cancel tournament" });
  }
};

// Tournament Leaderboard Management
export const updateLeaderboard: RequestHandler = async (req: any, res) => {
  try {
    const { tournamentId } = req.params;
    const { leaderboardData } = req.body;

    if (!Array.isArray(leaderboardData)) {
      return res.status(400).json({ error: "Invalid leaderboard data" });
    }

    // Clear existing leaderboard
    await db.query(
      "DELETE FROM tournament_leaderboard WHERE tournament_id = $1",
      [tournamentId],
    );

    // Insert new leaderboard entries
    for (const entry of leaderboardData) {
      await db.query(
        `INSERT INTO tournament_leaderboard (tournament_id, user_id, rank, score, prize)
         VALUES ($1, $2, $3, $4, $5)`,
        [tournamentId, entry.userId, entry.rank, entry.score, entry.prize || 0],
      );

      // Update participant rank
      await db.query(
        `UPDATE tournament_participants SET rank = $1 WHERE tournament_id = $2 AND user_id = $3`,
        [entry.rank, tournamentId, entry.userId],
      );
    }

    res.json({ success: true, message: "Leaderboard updated" });
  } catch (error) {
    console.error("Update leaderboard error:", error);
    res.status(500).json({ error: "Failed to update leaderboard" });
  }
};

export const getTournamentStats: RequestHandler = async (req: any, res) => {
  try {
    const activeTournamentsResult = await db.query(
      "SELECT COUNT(*) as count FROM tournaments WHERE status = 'active'",
    );
    const totalParticipantsResult = await db.query(
      "SELECT COUNT(*) as count FROM tournament_participants",
    );
    const totalPrizePoolResult = await db.query(
      "SELECT SUM(prize_pool) as total FROM tournaments",
    );

    res.json({
      stats: {
        activeTournaments: parseInt(activeTournamentsResult.rows[0].count),
        totalParticipants: parseInt(totalParticipantsResult.rows[0].count),
        totalPrizePool: parseFloat(totalPrizePoolResult.rows[0].total || 0),
      },
    });
  } catch (error) {
    console.error("Get tournament stats error:", error);
    res.status(500).json({ error: "Failed to fetch tournament stats" });
  }
};
