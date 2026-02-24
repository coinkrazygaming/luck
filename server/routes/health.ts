import { RequestHandler } from "express";
import { db } from "../lib/db";

/**
 * GET /api/health
 * Check server and database connectivity
 */
export const healthHandler: RequestHandler = async (req, res) => {
  try {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: null as string | null,
      },
    };

    try {
      // Test database connection
      await db.query("SELECT 1");
      health.database.connected = true;
    } catch (dbError) {
      health.database.connected = false;
      health.database.error = dbError instanceof Error ? dbError.message : String(dbError);
      health.status = "error";
    }

    res.json(health);
  } catch (error) {
    console.error("[Health] Handler error:", error);
    res.status(500).json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
};
