import mongooes from "mongoose";

const appointmentSchema = new mongooes.Schema(
  {
    ownerName: String,
    petName: String,
    phoneNumber: String,
    preferredDate: String,
    sessionId: String,
  },
  { timestamps: true }
);

export const appointment = new mongooes.model("appointment", appointmentSchema);
