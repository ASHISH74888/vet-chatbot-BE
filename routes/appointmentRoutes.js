import express from "express";
import {createAppointment , getAllAppointment} from "../controllers/appointmentController.js"

const router = express.Router();

router.post("/add" , createAppointment);
router.get("/get" , getAllAppointment);


export default router;