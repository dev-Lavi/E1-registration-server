import express from "express"; 
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import teamRoutes from "./api/teamRoutes.js";
import rateLimiter from "./middleware/rateLimiter.js";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import cors from "cors";

dotenv.config();
connectDB();

const app = express(); 

// ✅ Trust proxy for accurate IP detection (especially with rate limiter)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

//  CORS setup
app.use(cors());

//  Security middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(helmet());
app.use(rateLimiter);

// Routes
app.use("/api/teams", teamRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
