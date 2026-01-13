import express from "express";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import messageRoutes from "./routes/messageRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
dotenv.config();
app.use(cors());
app.use(express.json());

connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//serve frontend static files
app.use(express.static("public"));
// app.use(express.static(path.join(__dirname, "../frontend/dist")));

//routes

//for send and receive mssg
app.use("/api/message", messageRoutes);

//for creation of the appointment
app.use("/api/appointment", appointmentRoutes);

//react fallback
// React fallback
// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
// });

app.listen(3000, () => {
  console.log("Server is running on PORT:3000");
});
