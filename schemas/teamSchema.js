import Joi from "joi";

export const teamSchema = Joi.object({
  teamName: Joi.string().min(3).required(),
  hackerRankId: Joi.string().required(), // 👈 New field added here
  leader: Joi.object({
    name: Joi.string().min(3).required(),
    studentNumber: Joi.string().required(),
    year: Joi.string().required(),
    section: Joi.string().required(),
    gender: Joi.string().valid("Male", "Female", "Other").required(),
    residency: Joi.string().valid("Hosteller", "Day Scholar").required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().pattern(/^[0-9]{10}$/).required()
  }).required(),
  members: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().min(3).required(),
        studentNumber: Joi.string().required(),
        year: Joi.string().required(),
        section: Joi.string().required(),
        gender: Joi.string().valid("Male", "Female", "Other").required(),
        residency: Joi.string().valid("Hosteller", "Day Scholar").required()
      })
    )
    .min(2)
    .max(2)
    .required()
});
