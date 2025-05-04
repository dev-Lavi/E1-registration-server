import express from "express";
import axios from "axios";
import Team from "../models/Team.js";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { validateTeam } from "../middleware/validateTeam.js";

dotenv.config();
const router = express.Router();

const otpStore = new Map(); 
const verifiedEmails = new Set(); 

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_SENDER,
    pass: process.env.MAIL_PASSWORD
  }
});


router.post("/send-otp", async (req, res) => {
  const { email, studentNumber, "g-recaptcha-response": recaptchaToken } = req.body;

  if (!email) return res.status(400).json({ message: "Leader email is required" });
  if (!recaptchaToken) return res.status(400).json({ message: "reCAPTCHA challenge incomplete" });
  if (!studentNumber || !/^(23|24)\d{2,8}$/.test(studentNumber)) {
    return res.status(400).json({ message: "Student number must start with 23 or 24 and be between 4 and 10 digits." });
  }

  const trimmedEmail = email.trim().toLowerCase();

  // ✅ reCAPTCHA verification
  try {
    const captchaResponse = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: process.env.reCAPTCHA_secret_key,
          response: recaptchaToken
        }
      }
    );

    if (!captchaResponse.data.success) {
      return res.status(400).json({ message: "reCAPTCHA verification failed!" });
    }
  } catch (error) {
    console.error("reCAPTCHA error:", error);
    return res.status(500).json({ message: "reCAPTCHA verification failed. Please try again." });
  }

  if (!trimmedEmail.endsWith("@akgec.ac.in")) {
    return res.status(400).json({ message: "Leader email must end with '@akgec.ac.in'" });
  }

  // Optional strict check: email must match student number
  const emailPrefix = trimmedEmail.split('@')[0]; // Extract the part before "@akgec.ac.in"
  if (!emailPrefix.startsWith(studentNumber)) {
    return res.status(400).json({ message: "Email does not match student number" });
  }

  // ✅ Check if team already registered with this email
  try {
    const existingTeam = await Team.findOne({ 'leader.email': trimmedEmail });
    if (existingTeam) {
      return res.status(400).json({ message: "Email already exists" });
    }
  } catch (err) {
    console.error("Error checking email:", err);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 2 * 60 * 1000;
  otpStore.set(trimmedEmail, { otp, expiresAt });

  const jwtPayload = { email: trimmedEmail, studentNumber };
  const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: "10m" });

  const mailOptions = {
    from: `"Team Conatus" <${process.env.MAIL_SENDER}>`,
    to: trimmedEmail,
    subject: "OTP Verification - Team Registration",
    html: `
      <body style="font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f0f2f5; margin: 0; padding: 0;"> 
        <link href="https://fonts.googleapis.com/css2?family=Audiowide&display=swap" rel="stylesheet">
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #001f3f, #0074D9); color: white; padding: 20px; text-align: center;">
            <img src="https://i.ibb.co/Tk83nxf/b-logo.png" alt="logo" style="height: 70px; width: auto; margin-bottom: 10px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600; font-family: 'Audiowide', sans-serif;">Heist of Acropolis</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #4a4a4a; margin-top: 0;">Hello, <span style="color: #6e8efb; font-weight: 600;">${"Participant"}</span>!</h2>
            <p>Thank you for registering for Heist of Acropolis! Please use the following One-Time Password (OTP) to verify your email address:</p>
            <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
              <h1 style="margin: 0; font-size: 36px; color: #6e8efb;">${otp}</h1>
            </div>
            <p>This OTP is valid for <strong>2 minutes</strong>. Please do not share it with anyone for security reasons.</p>
            <p>If you did not initiate this request, feel free to ignore this email.</p>
            <p>Best regards,<br><strong>Team Conatus</strong></p>
          </div>
          <div style="background-color: #4a4a4a; color: white; text-align: center; padding: 20px; font-size: 14px;">
            <p><strong>Team Conatus</strong><br>Learn. Improvise. Grow.</p>
          </div>
        </div>
      </body>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({
      message: "OTP sent successfully!",
      token: jwtToken
    });
  } catch (err) {
    console.error("Failed to send OTP:", err);
    return res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
});




router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

  const trimmedEmail = email.trim();
  const stored = otpStore.get(trimmedEmail);

  if (!stored || stored.otp !== otp || stored.expiresAt < Date.now()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  verifiedEmails.add(trimmedEmail);
  otpStore.delete(trimmedEmail);

  return res.status(200).json({ message: "OTP verified successfully!" });
});




router.post("/register", validateTeam, async (req, res) => {

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token missing or malformed" });
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const leaderEmail = decoded.email?.trim();
  if (!leaderEmail) {
    return res.status(400).json({ message: "Email missing in token" });
  }

  try {
    if (!req.body.members || !Array.isArray(req.body.members) || req.body.members.length !== 2) {
      return res.status(400).json({ message: "members is required and should contain exactly 2 members." });
    }

    req.body.teamName = req.body.teamName.trim();
    req.body.leader.email = leaderEmail; // Force leader email from JWT

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

    verifiedEmails.delete(leaderEmail);

    const confirmationOptions = {
      from: `"Team Conatus" <${process.env.MAIL_SENDER}>`,
      to: leaderEmail,
      subject: "Team Registered Successfully 🎉",
      html: `
<body style="font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f0f2f5; margin: 0; padding: 0;"> 
    <link href="https://fonts.googleapis.com/css2?family=Audiowide&display=swap" rel="stylesheet">

    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #001f3f, #0074D9); color: white; padding: 20px; text-align: center;">
            <img src="https://i.ibb.co/Tk83nxf/b-logo.png" alt="logo" style="height: 70px; width: auto; margin-bottom: 10px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600; font-family: 'Audiowide', sans-serif;">Heist of Acropolis</h1>
        </div>

        <div style="padding: 30px;">
            <h2 style="color: #4a4a4a; margin-top: 0;">Dear Participants,</h2>
            <p>The countdown begins! You’re all set for the <strong>Heist of Acropolis </strong>experience!</p>
            <p>
Sharpen your wits, trust your instincts, and prepare for an adrenaline rush like never before.
Your ultimate adventure awaits — let the heist begin!</p>
            <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
                <h3 style="margin-top: 0; color: #0074D9;">📝 Note:</h3>
                <ul style="padding-left: 20px; margin-bottom: 0;">
                    <li style="margin-bottom: 10px;">Ensure all the team members are present on the day of the event.</li>
                    <li style="margin-bottom: 10px;">Be on time to get the most out of the event.</li>
                </ul>
            </div>

            <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
                <h3 style="margin-top: 0; color: #0074D9;">📍 Event Details:</h3>
                <ul style="padding-left: 20px; margin-bottom: 0;">
                    <li style="margin-bottom: 10px;"><strong>Venue:</strong> CS/IT BLOCK (3rd Floor)</li>
                    <li style="margin-bottom: 10px;"><strong>Dates:</strong> May 8th - 9th</li>
                    <li style="margin-bottom: 10px;"><strong>Time:</strong> 4:00 PM onwards</li>
                </ul>
            </div>

            <p>Stay connected with us on Instagram for event updates! 📱<br>
            Follow us here: <a href="https://bit.ly/instagram_conatus" style="color: #0074D9; text-decoration: none;">@conatus.akg</a></p>

            <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
                <h3 style="margin-top: 0; color: #0074D9;">📞 Contact Information:</h3>
                <p>If you have any questions or concerns leading up to the event, feel free to reach out:</p>
                <ul style="padding-left: 20px; margin-bottom: 0;">
                    <li style="margin-bottom: 10px;"> <strong>Phone: </strong>Yuga: 8090822729, Shubh: 8171915632</li>
                    <li style="margin-bottom: 10px;"><strong>Help Desk: </strong>CS/IT Block </li>
                    <li style="margin-bottom: 10px;"><strong>After 4 PM: </strong>CSE Lab 4 (4th Floor, CS/IT Block)</li>
                </ul>
            </div>

            <p>We're thrilled to have you join our crew for the ultimate heist.
Get ready — this is an experience you'll be talking about for a long time!</p>
        </div>

        <div style="background-color: #4a4a4a; color: white; text-align: center; padding: 20px; font-size: 14px;">
            <p><strong>Team Conatus</strong><br>Learn. Improvise. Grow.</p>
        </div>
    </div>
</body>
      `
    };    

    await transporter.sendMail(confirmationOptions);
    res.status(201).json({ message: "Team registered successfully!" });

  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error, please try again later." });
  }
});




router.get("/send-instruction-mail", async (req, res) => {
  try {
    const teams = await Team.find({}, { "leader.email": 1, "leader.name": 1, _id: 0 });

    if (teams.length === 0) {
      return res.status(404).json({ message: "No teams found to send instructions." });
    }

    for (const team of teams) {
      const leaderEmail = team.leader.email.trim();
      const leaderName = team.leader.name || "Participant";

      const instructionMailOptions = {
        from: `"Team Conatus" <${process.env.MAIL_SENDER}>`,
        to: leaderEmail,
        subject: "Final Instructions - Heist of Acropolis 🔥",
        html: `
<body style="font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f0f2f5; margin: 0; padding: 0;"> 
    <link href="https://fonts.googleapis.com/css2?family=Audiowide&display=swap" rel="stylesheet">

    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #001f3f, #0074D9); color: white; padding: 20px; text-align: center;">
            <img src="https://i.ibb.co/Tk83nxf/b-logo.png" alt="logo" style="height: 70px; width: auto; margin-bottom: 10px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600; font-family: 'Audiowide', sans-serif;">Heist of Acropolis</h1>
        </div>

        <div style="padding: 30px;">
            <h2 style="color: #4a4a4a; margin-top: 0;">Dear Participants,</h2>
            <p>We hope you are excited and ready for the thrilling 2-day event, <strong>"Heist of Acropolis"</strong>!</p>
            <p>Here's everything you need to know before the heist:</p>

            <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
                <h3 style="margin-top: 0; color: #0074D9;">📝 Important Instructions:</h3>
                <ul style="padding-left: 20px; margin-bottom: 0;">
                    <li style="margin-bottom: 10px;">Remember your login credentials <b>[Email id, HackerRank: id, password]</b> that you used during registration. You'll need these to participate in the contest.</li>
                    <li style="margin-bottom: 10px;">Hostel girls must register their entry in the permission register.</li>
                    <li style="margin-bottom: 10px;">No need to bring laptops — PCs will be provided.</li>
                    <li style="margin-bottom: 10px;">All team members must be present during the event.</li>
                </ul>
            </div>

            <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
                <h3 style="margin-top: 0; color: #0074D9;">📍 Event Details:</h3>
                <ul style="padding-left: 20px; margin-bottom: 0;">
                    <li style="margin-bottom: 10px;"><strong>Venue:</strong> CS/IT BLOCK (3rd Floor)</li>
                    <li style="margin-bottom: 10px;"><strong>Dates:</strong> May 8th</li>
                    <li style="margin-bottom: 10px;"><strong>Time:</strong> 4:00 PM onwards</li>
                </ul>
            </div>

            <p>Stay updated with the latest event news 📱<br>
            Follow us on Instagram: <a href="https://bit.ly/instagram_conatus" style="color: #0074D9; text-decoration: none;">@conatus.akg</a></p>

            <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
                <h3 style="margin-top: 0; color: #0074D9;">📞 Contact Information:</h3>
                <p>If you have any queries, feel free to reach out:</p>
                <ul style="padding-left: 20px; margin-bottom: 0;">
                    <li style="margin-bottom: 10px;">Phone: Yuga: 8090822729, Shubh: 8171915632</li>
                </ul>
            </div>

            <p>Let’s turn the <strong>"Heist of Acropolis"</strong> into an epic triumph!</p>
        </div>

        <div style="background-color: #4a4a4a; color: white; text-align: center; padding: 20px; font-size: 14px;">
            <p><strong>Team Conatus</strong><br>Learn. Improvise. Grow.</p>
        </div>
    </div>
</body>
        `
      };

      await transporter.sendMail(instructionMailOptions);
    }

    res.status(200).json({ message: "Instruction mails sent to all team leaders successfully." });
  } catch (err) {
    console.error("Error sending instruction mails:", err);
    res.status(500).json({ message: "Server error while sending instruction mails." });
  }
});


export default router;
