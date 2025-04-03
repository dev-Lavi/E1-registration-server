import express from "express";
import axios from "axios";
import Joi from "joi";
import Team from "../models/Team.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Define validation schema using Joi
const teamSchema = Joi.object({
    teamName: Joi.string().min(3).required(),
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
    members: Joi.array().items(
        Joi.object({
            name: Joi.string().min(3).required(),
            studentNumber: Joi.string().required(),
            year: Joi.string().required(),
            section: Joi.string().required(),
            gender: Joi.string().valid("Male", "Female", "Other").required(),
            residency: Joi.string().valid("Hosteller", "Day Scholar").required()
        })
    ).min(2).max(2).required() // Exactly 2 team members required
});

// Route: Register a new team
router.post("/register", async (req, res) => {
    
    const recaptchaToken = req.body["g-recaptcha-response"];

    console.log("Token:\n",recaptchaToken)
    if(!recaptchaToken){
        return res.status(400).json({message:"reCAPTCHA challenge incomplete"})
    }
    try{
        const response = await axios.post("https://www.google.com/recaptcha/api/siteverify", null,{
            params:{
                secret: process.env.reCAPTCHA_secret_key,
                response: recaptchaToken
            }
        })
        if(!response.data.success){
            console.log("reCAPTCHA failed")
            return res.status(400).json({message:"reCAPTCHA verification failed!"})
        }
        else
        console.log("reCAPTCHA verification successful")
        
        delete req.body["g-recaptcha-response"]; 
        const teamData = req.body;

        const { error} = teamSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const newTeam = new Team(teamData);
        await newTeam.save();
        res.status(201).json({ message: "Team registered successfully!" });
        console.log("Team registered")
    } catch (err) {
        res.status(500).json({ message: "Server error, please try again later." });
    }
});

export default router;
