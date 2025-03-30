import mongoose from "mongoose";
const teamSchema = new mongoose.Schema({
  teamName: String,
  leader: {
    name: String,
    email: String,
    phone: String,
    studentNumber: String,
    year: String,
    section: String,
    gender: String,
    residency: String,
  },
  members: [
    {
      name: String,
      studentNumber: String,
      year: String,
      section: String,
      gender: String,
      residency: String,
    },
  ],
});
export default mongoose.model("Team", teamSchema);