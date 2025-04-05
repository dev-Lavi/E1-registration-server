import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
  teamName: { type: String, required: true },
  leader: {
    name: { type: String, required: true },
    studentNumber: { type: String, required: true },
    year: { type: String, required: true },
    section: { type: String, required: true },
    gender: { type: String, required: true },
    residency: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
    hackerRankId: { type: String, required: true } // ✅ Added here
  },
  members: [
    {
      name: { type: String, required: true },
      studentNumber: { type: String, required: true },
      year: { type: String, required: true },
      section: { type: String, required: true },
      gender: { type: String, required: true },
      residency: { type: String, required: true }
    }
  ]
});

const Team = mongoose.model("Team", teamSchema);
export default Team;
