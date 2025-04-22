import express from "express"; 
import axios from "axios";
import Team from "../models/Team.js";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { validateTeam } from "../middleware/validateTeam.js";

dotenv.config();
const router = express.Router();

const otpStore = new Map(); 

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_SENDER,
    pass: process.env.MAIL_PASSWORD
  }
});


router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Leader email is required" });

  const trimmedEmail = email.trim();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpStore.set(trimmedEmail, { otp, expiresAt });

  const mailOptions = {
    from: `"Event Team" <${process.env.MAIL_SENDER}>`,
    to: trimmedEmail,
    subject: "OTP Verification - Team Registration",
    html: `<p>Your OTP for team registration is: <b>${otp}</b><br>It is valid for 5 minutes.</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent successfully!" });
  } catch (err) {
    console.error("Failed to send OTP:", err);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
});


router.post("/resend-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Leader email is required" });

  const trimmedEmail = email.trim();
  const storedOtp = otpStore.get(trimmedEmail);

  if (storedOtp && storedOtp.expiresAt > Date.now()) {
    return res.status(400).json({ message: "OTP is still valid. No need to resend." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpStore.set(trimmedEmail, { otp, expiresAt });

  const mailOptions = {
    from: `"Event Team" <${process.env.MAIL_SENDER}>`,
    to: trimmedEmail,
    subject: "OTP Verification - Team Registration",
    html: `<p>Your OTP for team registration is: <b>${otp}</b><br>It is valid for 5 minutes.</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP resent successfully!" });
  } catch (err) {
    console.error("Failed to resend OTP:", err);
    res.status(500).json({ message: "Failed to resend OTP. Please try again." });
  }
});


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

    const leaderEmail = req.body.leader.email.trim();
    const { emailOtp } = req.body;

    const stored = otpStore.get(leaderEmail);
    if (!stored || stored.otp !== emailOtp || stored.expiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    otpStore.delete(leaderEmail); 

    if (!req.body.members || !Array.isArray(req.body.members) || req.body.members.length !== 2) {
      return res.status(400).json({ message: "members is required and should contain exactly 2 members." });
    }

    req.body.teamName = req.body.teamName.trim();

    const duplicateFields = [];

    if (await Team.findOne({ teamName: req.body.teamName })) {
      duplicateFields.push("Team name is already taken");
    }

    if (await Team.findOne({ "leader.email": leaderEmail })) {
      duplicateFields.push("Leader email is already registered");
    }

    if (await Team.findOne({ "leader.studentNumber": req.body.leader.studentNumber })) {
      duplicateFields.push("Leader student number is already registered");
    }

    if (await Team.findOne({ "leader.mobile": req.body.leader.mobile })) {
      duplicateFields.push("Leader mobile number is already registered");
    }

    const memberStudentNumbers = req.body.members.map(m => m.studentNumber);
    if (await Team.findOne({ "members.studentNumber": { $in: memberStudentNumbers } })) {
      duplicateFields.push("One or more team member student numbers are already registered");
    }

    if (duplicateFields.length > 0) {
      return res.status(409).json({ message: "Duplicate data found", conflicts: duplicateFields });
    }

    const newTeam = new Team(req.body);
    await newTeam.save();


    const confirmationOptions = {
      from: `"Event Team" <${process.env.MAIL_SENDER}>`,
      to: leaderEmail,
      subject: "Team Registered Successfully 🎉",
      html: `
        <p>Hi <b>${req.body.leader.name}</b>,</p>
        <p>Your team <b>${req.body.teamName}</b> has been successfully registered!</p>
        <p>We're excited to have you onboard. All the best!</p>
        <br>
        <p>– Event Team</p>
      `
    };

    await transporter.sendMail(confirmationOptions);

    res.status(201).json({ message: "Team registered successfully!" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error, please try again later." });
  }
});

export default router;
