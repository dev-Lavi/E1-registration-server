// server.js
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import teamRoutes from "./api/teamRoutes.js";
import authRoutes from "./api/authRoutes.js";
import rateLimiter from "./middleware/rateLimiter.js";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(rateLimiter);

// Routes
app.use("/api/teams", teamRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));