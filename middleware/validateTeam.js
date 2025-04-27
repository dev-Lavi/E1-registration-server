export const validateTeam = (req, res, next) => {
  console.log("Before Validation:", JSON.stringify(req.body, null, 2));

  const { leader, members, emailOtp } = req.body;

  if (!leader || !leader.email || !leader.studentNumber || !leader.mobile) {
    return res.status(400).json({ message: "Leader details are incomplete." });
  }

  const studentNumberPattern = /^(23|24)\d{2,8}$/; 
  if (!studentNumberPattern.test(leader.studentNumber)) {
    return res.status(400).json({ message: "Leader's student number must start with 23 or 24 and be between 4 and 10 digits." });
  }

  if (members && Array.isArray(members)) {
    for (let member of members) {
      if (!member.studentNumber || !studentNumberPattern.test(member.studentNumber)) {
        return res.status(400).json({ message: `Member's student number must start with 23 or 24 and be between 4 and 10 digits.` });
      }
    }
  }

  if (!members || !Array.isArray(members) || members.length !== 2) {
    return res.status(400).json({ message: "members is required and should contain exactly 2 members." });
  }

  if (!emailOtp) {
    return res.status(400).json({ message: "OTP for leader email verification is required." });
  }

  next();
};
