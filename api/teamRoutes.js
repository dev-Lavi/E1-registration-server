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

    // Conflict checks one-by-one
    const duplicateFields = [];

    const teamWithSameName = await Team.findOne({ teamName: req.body.teamName });
    if (teamWithSameName) {
      duplicateFields.push("Team name is already taken");
    }

    const leaderEmailExists = await Team.findOne({ "leader.email": req.body.leader.email });
    if (leaderEmailExists) {
      duplicateFields.push("Leader email is already registered");
    }

    const leaderStudentNumberExists = await Team.findOne({ "leader.studentNumber": req.body.leader.studentNumber });
    if (leaderStudentNumberExists) {
      duplicateFields.push("Leader student number is already registered");
    }

    const leaderMobileExists = await Team.findOne({ "leader.mobile": req.body.leader.mobile });
    if (leaderMobileExists) {
      duplicateFields.push("Leader mobile number is already registered");
    }

    const memberStudentNumbers = req.body.members.map(m => m.studentNumber);
    const conflictingMember = await Team.findOne({
      "members.studentNumber": { $in: memberStudentNumbers }
    });
    if (conflictingMember) {
      duplicateFields.push("One or more team member student numbers are already registered");
    }

    if (duplicateFields.length > 0) {
      return res.status(409).json({
        message: "Duplicate data found",
        conflicts: duplicateFields
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
