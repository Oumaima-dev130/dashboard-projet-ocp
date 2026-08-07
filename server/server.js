import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";

dotenv.config();

const app = express();

const FRONTEND_URL =
  "https://dashboard-projet-ocp-production-cd76.up.railway.app";

/* =========================
   CORS
========================= */

const corsOptions = {
  origin: FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Autoriser explicitement les requêtes OPTIONS
app.options("*", cors(corsOptions));

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
    success: false,
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