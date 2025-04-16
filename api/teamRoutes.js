import express from "express";
import axios from "axios";
import Team from "../models/Team.js";
import dotenv from "dotenv";
import { validateTeam } from "../middleware/validateTeam.js";

dotenv.config();
const router = express.Router();

router.post("/register", validateTeam, async (req, res) => {
  console.log("Received data:", JSON.stringify(req.body, null, 2));

  const recaptchaToken = req.body["g-recaptcha-response"];
  if (!recaptchaToken) {
    return res.status(400).json({ message: "reCAPTCHA challenge incomplete" });
  }

  try {
    const response = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: process.env.reCAPTCHA_secret_key,
          response: recaptchaToken
        }
      }
    );

    if (!response.data.success) {
      return res.status(400).json({ message: "reCAPTCHA verification failed!" });
    }

    delete req.body["g-recaptcha-response"];

    // Validate members
    if (!req.body.members || !Array.isArray(req.body.members) || req.body.members.length !== 2) {
      return res.status(400).json({ message: "members is required and should contain exactly 2 members." });
    }

    // Trim teamName to avoid accidental duplicates with extra spaces
    req.body.teamName = req.body.teamName.trim();

    // Duplicate check
    const existingTeam = await Team.findOne({
      $or: [
        { teamName: req.body.teamName },
        { "leader.email": req.body.leader.email },
        { "leader.studentNumber": req.body.leader.studentNumber },
        { "leader.mobile": req.body.leader.mobile },
        {
          "members.studentNumber": {
            $in: req.body.members.map((m) => m.studentNumber)
          }
        }
      ]
    });

    if (existingTeam) {
      return res.status(409).json({
        message: "Team name or a team member/leader is already registered."
      });
    }

    // Optional logging
    if (req.body.leader.hackerRankId) {
      console.log("HackerRank ID:", req.body.leader.hackerRankId);
    }

    const newTeam = new Team(req.body);
    await newTeam.save();
    res.status(201).json({ message: "Team registered successfully!" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error, please try again later." });
  }
});

export default router;
