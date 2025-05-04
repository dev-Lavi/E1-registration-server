export const validateTeam = (req, res, next) => {
  console.log("Before Validation:", JSON.stringify(req.body, null, 2));

  const { leader, members } = req.body;

  if (!leader || !leader.email || !leader.studentNumber || !leader.mobile) { 
    return res.status(400).json({ message: "Leader details are incomplete." });
  }
  
  if (leader.name.trim().length > 20) {
    return res.status(400).json({ message: "Leader's name must not exceed 20 characters." });
  }

  const emailDomain = "@akgec.ac.in";

  const trimmedEmail = leader.email.trim();
  if (!trimmedEmail.endsWith(emailDomain)) {
    return res.status(400).json({ message: `Leader email must end with '${emailDomain}'.` });
  }

  const emailPrefix = trimmedEmail.split('@')[0]; 
  if (!emailPrefix.includes(leader.studentNumber)) {
    return res.status(400).json({ message: "Email does not match student number" });
  }

  const studentNumberPattern = /^(23|24)\d{2,8}$/; 
  if (!studentNumberPattern.test(leader.studentNumber)) {
    return res.status(400).json({ message: "Leader's student number must start with 23 or 24 and be between 4 and 10 digits." });
  }

  const mobilePattern = /^[6-9]\d{9}$/;
  if (!mobilePattern.test(leader.mobile)) {
    return res.status(400).json({ message: "Leader's mobile number must be a valid 10-digit number starting with 6-9." });
  }

  if (!members || !Array.isArray(members) || members.length !== 2) {
    return res.status(400).json({ message: "members is required and should contain exactly 2 members." });
  }

  for (let i = 0; i < members.length; i++) {
    const member = members[i];

    if (!member.name || member.name.trim().length > 20) {
      return res.status(400).json({ message: `Member ${i + 1}'s name must not exceed 20 characters.` });
    }

    if (!member.studentNumber || !studentNumberPattern.test(member.studentNumber)) {
      return res.status(400).json({ message: `Member ${i + 1}'s student number must start with 23 or 24 and be between 4 and 10 digits.` });
    }
  }


  next();
};
