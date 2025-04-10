import Joi from "joi";

export const teamSchema = Joi.object({
  teamName: Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9 ]+$/) // Only letters, numbers, and spaces
    .required(),

  hackerRankId: Joi.string()
    .alphanum()
    .min(3)
    .max(20)
    .required(),

  leader: Joi.object({
    name: Joi.string().min(3).required(),

    studentNumber: Joi.string()
      .pattern(/^\d+$/) // Only digits
      .required(),

    year: Joi.string()
      .valid("1st", "2nd", "3rd", "4th") // Only these values
      .required(),

    section: Joi.string()
      .pattern(/^[a-zA-Z]+[0-9]+$/) // Starts with letters, ends with numbers
      .required(),

    gender: Joi.string()
      .valid("Male", "Female", "Other")
      .required(),

    residency: Joi.string()
      .valid("Hosteller", "Day Scholar")
      .required(),

    email: Joi.string()
      .email({ tlds: { allow: false } }) // any domain
      .required(),

    mobile: Joi.string()
      .pattern(/^[6-9]\d{9}$/) // Indian mobile format
      .required()
  }).required(),

  members: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().min(3).required(),

        studentNumber: Joi.string()
          .pattern(/^\d+$/) // Only digits
          .required(),

        year: Joi.string()
          .valid("1st", "2nd", "3rd", "4th")
          .required(),

        section: Joi.string()
          .pattern(/^[a-zA-Z]+[0-9]+$/) // Same pattern as leader's section
          .required(),

        gender: Joi.string()
          .valid("Male", "Female", "Other")
          .required(),

        residency: Joi.string()
          .valid("Hosteller", "Day Scholar")
          .required()
      })
    )
    .min(2)
    .max(2)
    .required()
});
