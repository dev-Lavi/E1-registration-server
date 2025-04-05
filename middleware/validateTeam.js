
import { teamSchema } from "../schemas/teamSchema.js";

export const validateTeam = (req, res, next) => {
    console.log("Before Validation:", JSON.stringify(req.body, null, 2)); // Log request before validation
    if (!req.body.members || !Array.isArray(req.body.members) || req.body.members.length !== 2) {
      return res.status(400).json({ message: "members is required and should contain exactly 2 members." });
    }
    next();
  };
  
