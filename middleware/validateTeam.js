export const validateTeam = (req, res, next) => {
  console.log("Before Validation:", JSON.stringify(req.body, null, 2));

  const { leader, members, emailOtp } = req.body;

  if (!leader || !leader.email || !leader.studentNumber || !leader.mobile) {
    return res.status(400).json({ message: "Leader details are incomplete." });
  }

  if (!members || !Array.isArray(members) || members.length !== 2) {
    return res.status(400).json({ message: "members is required and should contain exactly 2 members." });
  }

  if (!emailOtp) {
    return res.status(400).json({ message: "OTP for leader email verification is required." });
  }

  next();
};
