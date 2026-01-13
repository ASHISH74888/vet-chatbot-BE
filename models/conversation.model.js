import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  id: String,
  text: String,
  sender: {
    type: String,
    enum: ["user", "bot", "system"],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const SessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    context: {
      userId: String,
      userName: String,
      petName: String,
      source: String,
    },
    messages: [MessageSchema],
  },
  {
    timestamps: true,
  }
);

export const conversation = mongoose.model("Session", SessionSchema);
