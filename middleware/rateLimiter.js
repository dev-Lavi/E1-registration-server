import rateLimit from "express-rate-limit";

// Helper to get real IP from Cloudflare
const getRealIP = (req) => req.headers['cf-connecting-ip'] || req.ip;

// OTP limiter (3 per minute)
export const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 3,
  keyGenerator: getRealIP,
  message: "Too many OTP requests, please try again in 1 minute.",
});

// Register limiter (2 per 10 minutes)
//export const registerLimiter = rateLimit({
  //windowMs: 10 * 60 * 1000, // 10 min
  //max: 5,
  //keyGenerator: getRealIP,
  //message: "Too many registration attempts. Try again later.",
//});
