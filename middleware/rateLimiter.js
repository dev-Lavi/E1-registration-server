// rateLimiter.js
import rateLimit from "express-rate-limit";

const getRealIP = (req) => req.headers['cf-connecting-ip'] || req.ip;

const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  keyGenerator: getRealIP,
  message: "Too many OTP requests, please try again in 1 minute.",
});

const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 2,
  keyGenerator: getRealIP,
  message: "Too many registration attempts. Try again later.",
});

export default { otpLimiter, registerLimiter }; // Default export an object with the limiters
