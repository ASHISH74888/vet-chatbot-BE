import express from "express";
import { appointment } from "../models/appointments.model.js";

export const createAppointment = async (req, res) => {
  try {
    const { ownerName, petName, phoneNumber, preferredDate, sessionId } =
      req.body;

    const existingAppointment = await appointment.findOne({
      phoneNumber: phoneNumber,
    });

    if (existingAppointment) {
      return res
        .status(400)
        .json(
          "Appointment already registered for the above Phone Number mentioned... try another phone number!!"
        );
    }
    const newAppointment = {
      ownerName,
      petName,
      phoneNumber,
      preferredDate,
      sessionId,
    };
    const addAppointment = await appointment.create(newAppointment);
    res.status(201).json(newAppointment);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllAppointment = async (req, res) => {
  try {
    const allAppointments = await appointment.find().sort({ createdAt:-1});
    res.status(200).json(allAppointments);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
