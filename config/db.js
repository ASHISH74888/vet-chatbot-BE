import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI);
    console.log("Mongo-DB server connected.....");
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
