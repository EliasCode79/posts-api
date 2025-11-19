import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser"; // NEW
import postRoutes from "./routes/post.routes";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/posts-db";

// Middlewares
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:8000"], // NEW: specific origins
    credentials: true, // NEW: allow cookies
  })
);
app.use(express.json());
app.use(cookieParser()); // NEW: Parse cookies

// Health check (NEW - recommended for Docker healthchecks)
app.get("/api/posts/health", (req, res) => {
  res.json({ status: "OK", service: "posts-service" });
});
app.head("/api/posts/health", (req, res) => {
  res.status(200).end();
});
// Routes
app.use("/api/posts", postRoutes);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Connect DB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ DB connection error:", err));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Posts service running on http://localhost:${PORT}`);
});