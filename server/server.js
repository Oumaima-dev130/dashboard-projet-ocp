import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* =========================
   CORS
========================= */

const allowedOrigins = [
  "https://dashboard-projet-ocp-production-cd76.up.railway.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Autoriser les requêtes sans origin
      // (ex: Postman, certains outils serveur)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

/* =========================
   MIDDLEWARES
========================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   TEST API
========================= */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API OCP fonctionne",
  });
});

app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API OCP fonctionne",
  });
});

/* =========================
   ROUTES
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/projects", projectRoutes);

/* =========================
   ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  console.error("❌ ERREUR SERVEUR :", err);

  res.status(500).json({
    message: err.message || "Erreur serveur",
  });
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("⏳ Connexion à MongoDB...");

    await connectDB();

    console.log("✅ MongoDB connecté");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Impossible de démarrer le serveur :", error);
    process.exit(1);
  }
};

startServer();