import rateLimit from "express-rate-limit"; 
const rateLimiter = rateLimit({
  windowMs: 100 * 60 * 1000,
  max: 27,
  message: "Too many requests, please try again later.",
});
export default rateLimiter;