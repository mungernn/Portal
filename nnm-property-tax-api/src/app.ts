import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins,
      methods: ["GET", "POST", "PATCH"],
    }),
  );
  // 10mb, not the more typical 1mb - the attendance module's daily
  // group photo upload sends a base64-encoded JPEG/PNG in the JSON
  // body (up to 8MB raw, ~11MB as base64). Raising this globally rather
  // than scoping it to one route, since this is an internal staff tool
  // behind auth and the existing rate limiter, not a high-traffic public
  // API - the added complexity of per-route body-parser limits isn't
  // worth it here.
  app.use(express.json({ limit: "10mb" }));
  app.use(
    pinoHttp({
      autoLogging: true,
      redact: ["req.headers.authorization"],
    }),
  );
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}