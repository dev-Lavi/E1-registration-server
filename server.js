// server.js
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import teamRoutes from "./api/teamRoutes.js";
import rateLimiter from "./middleware/rateLimiter.js";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Routes
app.use("/api/teams", teamRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));