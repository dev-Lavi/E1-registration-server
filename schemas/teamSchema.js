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
      .pattern(/^\d+$/)
      .required(),
    year: Joi.string()
      .valid("1st", "2nd", "3rd", "4th")
      .required(),
    gender: Joi.string()
      .valid("Male", "Female", "Other")
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
          .pattern(/^\d+$/)
          .required(),
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
