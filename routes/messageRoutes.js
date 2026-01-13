import express from "express";
import { createmssg } from "../controllers/chatMessagesController.js";

const router = express.Router();

// router.get("/getMessage", getAllmssg);
router.post("/addMessage", createmssg);

export default router;
