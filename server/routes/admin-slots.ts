import { RequestHandler } from "express";
import { db } from "../lib/db";

// Popular real slot games from major providers
const POPULAR_SLOTS = [
  {
    name: "Book of Dead",
    provider: "Play'n GO",
    rtp: 96.21,
    volatility: "high",
    paylines: 10,
    minBet: 0.1,
    maxBet: 100,
    description: "Ancient Egypt themed slot with expanding symbols and free spins",
    thumbnail:
      "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop",
    features: ["Expanding Symbols", "Free Spins", "Book Bonus"],
    release_year: 2015,
    is_active: true,
  },
  {
    name: "Starburst",
    provider: "NetEnt",
    rtp: 96.1,
    volatility: "low",
    paylines: 10,
    minBet: 0.01,
    maxBet: 100,
    description: "Cosmic space adventure with expanding wilds and respins",
    thumbnail:
      "https://images.unsplash.com/photo-1579546117272-67cb64efd41e?w=400&h=300&fit=crop",
    features: ["Expanding Wilds", "Respins", "High Speed"],
    release_year: 2012,
    is_active: true,
  },
  {
    name: "Wolf Gold",
    provider: "Pragmatic Play",
    rtp: 96.01,
    volatility: "medium",
    paylines: 25,
    minBet: 0.25,
    maxBet: 125,
    description: "Wild west theme with free spins and money respin feature",
    thumbnail:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    features: ["Money Respin", "Free Spins", "Blazing Reels"],
    release_year: 2017,
    is_active: true,
  },
  {
    name: "Great Rhino",
    provider: "Pragmatic Play",
    rtp: 96.53,
    volatility: "medium",
    paylines: 20,
    minBet: 0.2,
    maxBet: 100,
    description: "African safari with wild animals and big win potential",
    thumbnail:
      "https://images.unsplash.com/photo-1515624521402-5176eaf60bed?w=400&h=300&fit=crop",
    features: ["Wild Substitute", "Free Spins", "Multiplier"],
    release_year: 2017,
    is_active: true,
  },
  {
    name: "Buffalo King Megaways",
    provider: "Pragmatic Play",
    rtp: 96.19,
    volatility: "high",
    paylines: 117649,
    minBet: 0.25,
    maxBet: 125,
    description: "Megaways slot with up to 117,649 ways to win",
    thumbnail:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop",
    features: ["Megaways", "Dynamic Paylines", "Free Spins"],
    release_year: 2019,
    is_active: true,
  },
  {
    name: "Gonzo's Quest",
    provider: "NetEnt",
    rtp: 96.0,
    volatility: "medium",
    paylines: 20,
    minBet: 0.2,
    maxBet: 100,
    description: "South American adventure with avalanche feature",
    thumbnail:
      "https://images.unsplash.com/photo-1618519738629-ee370bbb7588?w=400&h=300&fit=crop",
    features: ["Avalanche", "Free Fall", "Multiplier"],
    release_year: 2010,
    is_active: true,
  },
  {
    name: "Twin Spin",
    provider: "NetEnt",
    rtp: 96.88,
    volatility: "low",
    paylines: 243,
    minBet: 0.01,
    maxBet: 100,
    description: "Retro styled slot with linked twin reels",
    thumbnail:
      "https://images.unsplash.com/photo-1576084927a5e4c0d9a5d5c5c1e9f5e9f?w=400&h=300&fit=crop",
    features: ["Twin Reels", "Free Spins", "Classic Design"],
    release_year: 2013,
    is_active: true,
  },
  {
    name: "Bonanza",
    provider: "Big Time Gaming",
    rtp: 96.0,
    volatility: "high",
    paylines: 117649,
    minBet: 0.25,
    maxBet: 125,
    description: "Gold mining theme with Megaways mechanic",
    thumbnail:
      "https://images.unsplash.com/photo-1566549387789-53a64a4e9d51?w=400&h=300&fit=crop",
    features: ["Megaways", "Cascading", "Free Spins"],
    release_year: 2017,
    is_active: true,
  },
  {
    name: "Sweet Bonanza",
    provider: "Pragmatic Play",
    rtp: 96.48,
    volatility: "high",
    paylines: 6561,
    minBet: 0.25,
    maxBet: 125,
    description: "Colorful candy theme with multiplier free spins",
    thumbnail:
      "https://images.unsplash.com/photo-1563269865-cbf427effbad?w=400&h=300&fit=crop",
    features: ["Cascading Symbols", "Free Spins", "High Volatility"],
    release_year: 2020,
    is_active: true,
  },
  {
    name: "The Dog House",
    provider: "Pragmatic Play",
    rtp: 96.51,
    volatility: "high",
    paylines: 11,
    minBet: 0.1,
    maxBet: 50,
    description: "Dog themed slot with sticky wilds feature",
    thumbnail:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    features: ["Sticky Wilds", "Free Spins", "Multipliers"],
    release_year: 2019,
    is_active: true,
  },
  {
    name: "Aztec Gems Deluxe",
    provider: "Pragmatic Play",
    rtp: 96.52,
    volatility: "low",
    paylines: 5,
    minBet: 0.03,
    maxBet: 30,
    description: "Aztec ancient civilization with simple mechanics",
    thumbnail:
      "https://images.unsplash.com/photo-1532612612454-829cf14ee57d?w=400&h=300&fit=crop",
    features: ["Gem Symbols", "Respin Feature", "Low Volatility"],
    release_year: 2021,
    is_active: true,
  },
  {
    name: "Mustang Gold",
    provider: "Pragmatic Play",
    rtp: 96.73,
    volatility: "medium",
    paylines: 25,
    minBet: 0.25,
    maxBet: 125,
    description: "Wild horse western theme with free spins",
    thumbnail:
      "https://images.unsplash.com/photo-1565529030245-4b6aaead1065?w=400&h=300&fit=crop",
    features: ["Free Spins", "Money Respin", "Western Theme"],
    release_year: 2017,
    is_active: true,
  },
  {
    name: "Dead or Alive 2",
    provider: "NetEnt",
    rtp: 96.82,
    volatility: "very high",
    paylines: 9,
    minBet: 0.09,
    maxBet: 90,
    description: "Wild west showdown with high volatility",
    thumbnail:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    features: ["High Volatility", "Free Spins", "Multipliers"],
    release_year: 2019,
    is_active: true,
  },
  {
    name: "Reactoonz 2",
    provider: "Play'n GO",
    rtp: 96.2,
    volatility: "high",
    paylines: 5,
    minBet: 0.2,
    maxBet: 100,
    description: "Alien creatures with cascading symbols",
    thumbnail:
      "https://images.unsplash.com/photo-1579546117272-67cb64efd41e?w=400&h=300&fit=crop",
    features: ["Cascading", "Combos", "Free Spins"],
    release_year: 2021,
    is_active: true,
  },
  {
    name: "Big Bass Bonanza",
    provider: "Pragmatic Play",
    rtp: 96.71,
    volatility: "medium",
    paylines: 5,
    minBet: 0.1,
    maxBet: 50,
    description: "Fishing theme with hold and win mechanics",
    thumbnail:
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop",
    features: ["Hold and Win", "Free Spins", "Fishing Theme"],
    release_year: 2021,
    is_active: true,
  },
];

async function initializeSlotsTable() {
  try {
    // Create slots table
    await db.query(`
      CREATE TABLE IF NOT EXISTS slots_games (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        provider VARCHAR(255) NOT NULL,
        rtp DECIMAL(5, 2) NOT NULL,
        volatility VARCHAR(50) NOT NULL,
        paylines INTEGER NOT NULL,
        min_bet DECIMAL(10, 2) NOT NULL,
        max_bet DECIMAL(10, 2) NOT NULL,
        description TEXT,
        thumbnail TEXT,
        features TEXT[] NOT NULL,
        release_year INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if we have games already
    const existing = await db.query("SELECT COUNT(*) as count FROM slots_games");
    if (existing.rows[0].count === 0) {
      // Seed with popular games
      for (const game of POPULAR_SLOTS) {
        await db.query(
          `
          INSERT INTO slots_games 
          (name, provider, rtp, volatility, paylines, min_bet, max_bet, description, thumbnail, features, release_year, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `,
          [
            game.name,
            game.provider,
            game.rtp,
            game.volatility,
            game.paylines,
            game.minBet,
            game.maxBet,
            game.description,
            game.thumbnail,
            game.features,
            game.release_year,
            game.is_active,
          ]
        );
      }
      console.log("Slots games table initialized with popular games");
    }
  } catch (error) {
    console.error("Error initializing slots table:", error);
    throw error;
  }
}

// Public routes - get all active games
export const getSlots: RequestHandler = async (req: any, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM slots_games WHERE is_active = true ORDER BY release_year DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({ error: "Failed to fetch slots" });
  }
};

export const getSlotById: RequestHandler = async (req: any, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`SELECT * FROM slots_games WHERE id = $1`, [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching slot:", error);
    res.status(500).json({ error: "Failed to fetch slot" });
  }
};

// Admin routes
export const getSlotsAdmin: RequestHandler = async (req: any, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM slots_games ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({ error: "Failed to fetch slots" });
  }
};

export const createSlot: RequestHandler = async (req: any, res) => {
  try {
    const {
      name,
      provider,
      rtp,
      volatility,
      paylines,
      minBet,
      maxBet,
      description,
      thumbnail,
      features,
      releaseYear,
      isActive,
    } = req.body;

    const result = await db.query(
      `
      INSERT INTO slots_games 
      (name, provider, rtp, volatility, paylines, min_bet, max_bet, description, thumbnail, features, release_year, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `,
      [
        name,
        provider,
        rtp,
        volatility,
        paylines,
        minBet,
        maxBet,
        description,
        thumbnail,
        features,
        releaseYear,
        isActive !== false,
      ]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("Error creating slot:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to create slot" });
  }
};

export const updateSlot: RequestHandler = async (req: any, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      provider,
      rtp,
      volatility,
      paylines,
      minBet,
      maxBet,
      description,
      thumbnail,
      features,
      releaseYear,
      isActive,
    } = req.body;

    const result = await db.query(
      `
      UPDATE slots_games 
      SET name = $1, provider = $2, rtp = $3, volatility = $4, paylines = $5,
          min_bet = $6, max_bet = $7, description = $8, thumbnail = $9,
          features = $10, release_year = $11, is_active = $12, updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `,
      [
        name,
        provider,
        rtp,
        volatility,
        paylines,
        minBet,
        maxBet,
        description,
        thumbnail,
        features,
        releaseYear,
        isActive,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("Error updating slot:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to update slot" });
  }
};

export const deleteSlot: RequestHandler = async (req: any, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `DELETE FROM slots_games WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.json({ message: "Game deleted successfully" });
  } catch (error) {
    console.error("Error deleting slot:", error);
    res.status(500).json({ error: "Failed to delete slot" });
  }
};

export const getSlotStats: RequestHandler = async (req: any, res) => {
  try {
    const totalGames = await db.query(`SELECT COUNT(*) as count FROM slots_games`);
    const activeGames = await db.query(
      `SELECT COUNT(*) as count FROM slots_games WHERE is_active = true`
    );
    const providers = await db.query(
      `SELECT DISTINCT provider FROM slots_games ORDER BY provider`
    );
    const avgRtp = await db.query(
      `SELECT AVG(rtp) as avg_rtp FROM slots_games`
    );

    res.json({
      totalGames: totalGames.rows[0].count,
      activeGames: activeGames.rows[0].count,
      providers: providers.rows.map((r: any) => r.provider),
      averageRtp: parseFloat(avgRtp.rows[0].avg_rtp).toFixed(2),
    });
  } catch (error) {
    console.error("Error fetching slot stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

export { initializeSlotsTable };
