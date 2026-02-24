import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  getTournaments,
  getTournament,
  registerForTournament,
  unregisterFromTournament,
  getTournamentLeaderboard,
  createTournament,
  startTournament,
  cancelTournament,
} from "./routes/tournaments";
import {
  getProviders as getSlotProviders,
  getGames as getSlotGames,
  getGameById,
  launchGame,
  validateSession,
  endSession,
  getPlayerBalance,
  getActiveSessions,
  checkProviderHealth,
  testProviders,
} from "./routes/slots";
import {
  getThumbnail,
  preloadThumbnails,
  getCacheStats,
  clearCache,
  serveThumbnail,
} from "./routes/thumbnails";
import {
  getPublicProviders,
  getPublicGames,
  getPublicGameDetails,
  getPublicGameEmbed,
  getPublicApiDocs,
  getRateLimitStatus,
} from "./routes/publicApi";
import {
  getUserTransactions,
  getUserBalance,
  recordTransaction,
} from "./routes/transactions";
import {
  getAllGames,
  getGame,
  createGameSession,
  endGameSession,
  validateGameSession,
} from "./routes/games";
import {
  loginHandler,
  registerHandler,
  logoutHandler,
  refreshHandler,
} from "./routes/auth";
import { healthHandler } from "./routes/health";
import { initializeDatabase } from "./lib/db";
import { initGamesDB } from "./routes/admin-games";
import { initFinancialDB } from "./routes/admin-financial";
import { initTournamentsDB } from "./routes/admin-tournaments";
import { initPackagesDB } from "./routes/admin-packages";
import { initializeSlotsTable } from "./routes/admin-slots";

export function createServer() {
  const app = express();

  // Initialize database
  initializeDatabase()
    .then(() => {
      // Initialize other databases after main database is ready
      return Promise.all([
        initGamesDB(),
        initFinancialDB(),
        initTournamentsDB(),
        initPackagesDB(),
        initializeSlotsTable(),
      ]);
    })
    .catch((error) => {
      console.error("Failed to initialize databases:", error);
    });

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/health", healthHandler);

  app.get("/api/demo", handleDemo);

  // Auth routes (proxy to Supabase)
  app.post("/api/auth/login", loginHandler);
  app.post("/api/auth/register", registerHandler);
  app.post("/api/auth/logout", logoutHandler);
  app.post("/api/auth/refresh", refreshHandler);

  // Tournament routes
  app.get("/api/tournaments", getTournaments);
  app.get("/api/tournaments/:id", getTournament);
  app.post("/api/tournaments/:id/register", registerForTournament);
  app.post("/api/tournaments/:id/unregister", unregisterFromTournament);
  app.get("/api/tournaments/:id/leaderboard", getTournamentLeaderboard);
  app.post("/api/tournaments", createTournament);
  app.post("/api/tournaments/:id/start", startTournament);
  app.post("/api/tournaments/:id/cancel", cancelTournament);

  // Slot provider routes
  app.get("/api/slots/providers", getSlotProviders);
  app.get("/api/slots", getSlotGames);
  app.get("/api/slots/providers/:providerId/games/:gameId", getGameById);
  app.post("/api/slots/launch", launchGame);
  app.post("/api/slots/validate-session", validateSession);
  app.post("/api/slots/end-session", endSession);
  app.get(
    "/api/slots/providers/:providerId/balance/:playerId",
    getPlayerBalance,
  );
  app.get("/api/slots/admin/sessions", getActiveSessions);
  app.get("/api/slots/admin/health", checkProviderHealth);
  app.get("/api/slots/admin/test", testProviders);

  // Thumbnail routes
  app.get("/api/thumbnails", getThumbnail);
  app.post("/api/thumbnails/preload", preloadThumbnails);
  app.get("/api/thumbnails/stats", getCacheStats);
  app.delete("/api/thumbnails/cache", clearCache);
  app.get("/thumbnails/:filename", serveThumbnail);

  // Public API routes (for external access to free games)
  app.get("/api/public/docs", getPublicApiDocs);
  app.get("/api/public/providers", getPublicProviders);
  app.get("/api/public/games", getPublicGames);
  app.get("/api/public/games/:providerId/:gameId", getPublicGameDetails);
  app.get("/api/public/embed/:providerId/:gameId", getPublicGameEmbed);
  app.get("/api/public/rate-limit", getRateLimitStatus);

  // Transaction routes
  app.get("/api/transactions", getUserTransactions);
  app.get("/api/balance", getUserBalance);
  app.post("/api/transactions", recordTransaction);

  // Game routes (real database-backed)
  app.get("/api/games", getAllGames);
  app.get("/api/games/:id", getGame);
  app.post("/api/game-sessions", createGameSession);
  app.post("/api/game-sessions/end", endGameSession);
  app.post("/api/game-sessions/validate", validateGameSession);

  return app;
}
