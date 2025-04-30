import Joi from "joi";

export const teamSchema = Joi.object({
  teamName: Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9 ]+$/)
    .required(),

  emailOtp: Joi.string()
    .length(6)
    .pattern(/^\d+$/)
    .required()
    .messages({
      "string.length": "OTP should be exactly 6 digits.",
      "string.pattern.base": "OTP should only contain digits."
    }),

  leader: Joi.object({
    name: Joi.string().min(3).required(),
    studentNumber: Joi.string()
      .pattern(/^(23|24)\d{2,8}$/)  
      .min(4)
      .max(10)
      .required()
      .messages({
        "string.pattern.base": "Student number should start with 23 or 24 and be between 4 to 10 digits long."
      }),
    year: Joi.string()
      .valid("1st", "2nd")
      .required(),
    gender: Joi.string()
      .valid("Male", "Female")
      .required(),
    residency: Joi.string()
      .valid("Hosteller", "Day Scholar")
      .required(),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
    mobile: Joi.string()
      .pattern(/^[6-9]\d{9}$/)
      .required(),
    hackerRankId: Joi.string()
      .alphanum()
      .min(3)
      .max(20)
      .required()
  }).required(),

  members: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().min(3).required(),
        studentNumber: Joi.string()
          .pattern(/^(23|24)\d{2,8}$/)  
          .min(4)
          .max(10)
          .required()
          .messages({
            "string.pattern.base": "Student number should start with 23 or 24 and be between 4 to 10 digits long."
          }),
        year: Joi.string()
          .valid("1st", "2nd")
          .required(),
        gender: Joi.string()
          .valid("Male", "Female")
          .required(),
        residency: Joi.string()
          .valid("Hosteller", "Day Scholar")
          .required()
      })
    )
    .length(2)
    .required()
});
