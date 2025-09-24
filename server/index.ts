import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  getAllFighters,
  getFighter,
  getRankings,
  getDivision,
  searchFightersEndpoint
} from "./routes/octagon";
import { getUpcomingFightsProxy } from "./routes/upcoming";
import { postFightCardStatusProxy } from "./routes/fightCard";
import { getFighterImage, getEventPoster } from "./routes/images";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Octagon API routes (prefixed with /api to avoid React route conflicts)
  app.get("/api/fighters", getAllFighters);
  app.get("/api/fighter/:fighterId", getFighter);
  app.get("/api/rankings", getRankings);
  app.get("/api/division/:divisionId", getDivision);
  app.get("/api/search", searchFightersEndpoint);

  // External upcoming fights proxy
  app.get("/api/upcoming-fights", getUpcomingFightsProxy);
  app.post("/api/fight-card-status", postFightCardStatusProxy);

  // Images
  app.get("/api/image/fighter", getFighterImage);
  app.get("/api/image/event", getEventPoster);

  // Add API status endpoint
  app.get("/api/status", (_req, res) => {
    res.json({
      status: "online",
      message: "Local Octagon API running",
      timestamp: new Date().toISOString()
    });
  });

  return app;
}
