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
  getProviders,
  getGames,
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
  register,
  login,
  getSession,
  logout,
  updateProfile,
} from "./routes/auth";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAdminStats,
  getUserStats,
  getSystemStatus,
  getDashboardData,
} from "./routes/admin";
import {
  getProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  getGames,
  createGame,
  updateGame,
  deleteGame,
  getBlacklist,
  addToBlacklist,
  removeFromBlacklist,
  getGameStats,
  initGamesDB,
} from "./routes/admin-games";
import {
  getTransactions,
  getTransactionStats,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getWithdrawalStats,
  getUserBalance,
  updateUserBalance,
  getRevenueReport,
  getFinancialSummary,
  initFinancialDB,
} from "./routes/admin-financial";
import { authMiddleware, requireAdmin } from "./lib/auth-middleware";
import { initializeDatabase } from "./lib/db";

export function createServer() {
  const app = express();

  // Initialize database
  initializeDatabase().catch((error) => {
    console.error("Failed to initialize database:", error);
  });

  // Initialize games database
  initGamesDB().catch((error) => {
    console.error("Failed to initialize games database:", error);
  });

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Authentication routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.get("/api/auth/session", getSession);
  app.post("/api/auth/logout", logout);
  app.post("/api/auth/profile", updateProfile);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

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
  app.get("/api/slots/providers", getProviders);
  app.get("/api/slots/games", getGames);
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

  // Admin API routes - User Management
  app.get("/api/admin/stats", ...requireAdmin, getAdminStats);
  app.get("/api/admin/users", ...requireAdmin, getAllUsers);
  app.get("/api/admin/users/:userId", ...requireAdmin, getUserById);
  app.post("/api/admin/users/:userId", ...requireAdmin, updateUser);
  app.delete("/api/admin/users/:userId", ...requireAdmin, deleteUser);
  app.get("/api/admin/users/:userId/stats", ...requireAdmin, getUserStats);
  app.get("/api/admin/system", ...requireAdmin, getSystemStatus);
  app.get("/api/admin/dashboard", ...requireAdmin, getDashboardData);

  // Admin API routes - Game Management
  app.get("/api/admin/providers", ...requireAdmin, getProviders);
  app.post("/api/admin/providers", ...requireAdmin, createProvider);
  app.post("/api/admin/providers/:providerId", ...requireAdmin, updateProvider);
  app.delete("/api/admin/providers/:providerId", ...requireAdmin, deleteProvider);

  app.get("/api/admin/games", ...requireAdmin, getGames);
  app.post("/api/admin/games", ...requireAdmin, createGame);
  app.post("/api/admin/games/:gameId", ...requireAdmin, updateGame);
  app.delete("/api/admin/games/:gameId", ...requireAdmin, deleteGame);

  app.get("/api/admin/games-stats", ...requireAdmin, getGameStats);
  app.get("/api/admin/blacklist", ...requireAdmin, getBlacklist);
  app.post("/api/admin/blacklist", ...requireAdmin, addToBlacklist);
  app.delete("/api/admin/blacklist/:blacklistId", ...requireAdmin, removeFromBlacklist);

  return app;
}
