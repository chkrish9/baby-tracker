import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { generalLimiter } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth.routes";
import babiesRoutes from "./routes/babies.routes";
import feedingRoutes from "./routes/feeding.routes";
import diapersRoutes from "./routes/diapers.routes";
import doctorNotesRoutes from "./routes/doctorNotes.routes";
import growthRoutes from "./routes/growth.routes";
import healthRecordsRoutes from "./routes/healthRecords.routes";
import vaccinationsRoutes from "./routes/vaccinations.routes";
import appointmentsRoutes from "./routes/appointments.routes";
import photosRoutes from "./routes/photos.routes";
import parentsRoutes from "./routes/parents.routes";
import invitesRoutes from "./routes/invites.routes";
import userRoutes from "./routes/user.routes";
import filesRoutes from "./routes/files.routes";

export function createApp() {
  const app = express();

  app.use(
    helmet({
      // The UI and API are intentionally different origins — images served
      // from /files must be embeddable cross-origin. CORS above still
      // restricts which origin can actually call the API.
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  app.disable("x-powered-by");
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(generalLimiter);

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/auth", authRoutes);
  app.use("/babies/:babyId/feeding", feedingRoutes);
  app.use("/babies/:babyId/diapers", diapersRoutes);
  app.use("/babies/:babyId/doctor-notes", doctorNotesRoutes);
  app.use("/babies/:babyId/growth", growthRoutes);
  app.use("/babies/:babyId/health-records", healthRecordsRoutes);
  app.use("/babies/:babyId/vaccinations", vaccinationsRoutes);
  app.use("/babies/:babyId/appointments", appointmentsRoutes);
  app.use("/babies/:babyId/photos", photosRoutes);
  app.use("/babies/:babyId/parents", parentsRoutes);
  app.use("/babies", babiesRoutes);
  app.use("/invites", invitesRoutes);
  app.use("/user", userRoutes);
  app.use("/files", filesRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use(errorHandler);

  return app;
}
