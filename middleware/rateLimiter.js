import rateLimit from "express-rate-limit"; 

// Function to get the real IP address from Cloudflare header
const getRealIP = (req) => {
  return req.headers['cf-connecting-ip'] || req.connection.remoteAddress;
};

// Create the rate limiter middleware
const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 10 minutes
  max: 3, // limit each IP to 10 requests per windowMs
  keyGenerator: (req) => getRealIP(req), // Use the real IP from Cloudflare's header
  message: "Too many requests, please try again later.", // Custom message
});

export default rateLimiter;