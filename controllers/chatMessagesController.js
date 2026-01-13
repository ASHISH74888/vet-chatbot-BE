import express from "express";
import { randomUUID } from "crypto";
import { conversation } from "../models/conversation.model.js";
import { appointment } from "../models/appointments.model.js";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
You are a specialized Veterinary Assistant Chatbot. 
Your goal is to help users with PET HEALTH questions and APPOINTMENT BOOKING.

RULES:
1. ONLY answer questions related to veterinary medicine, pet care, animal biology, or the clinic.
2. If a user asks about non-veterinary topics (coding, math, history, cooking humans, etc.), politely refuse and state you are only a vet assistant.
3. Be empathetic, professional, and concise.
4. If the user indicates they want to book an appointment, use the 'book_appointment' tool.
5. You do not need to ask for a specific doctor, just the basic details (Name, Pet, Phone, Time).
6. If the user provides context (like their name or pet name) in the prompt, use it.
`;

// Tool Definition
const bookAppointmentTool = {
  functionDeclarations: [
    {
      name: "book_appointment",
      description:
        "Book a veterinary appointment. You must collect all fields: ownerName, petName, phoneNumber, and preferredDate.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          ownerName: {
            type: Type.STRING,
            description: "The full name of the pet owner.",
          },
          petName: { type: Type.STRING, description: "The name of the pet." },
          phoneNumber: {
            type: Type.STRING,
            description: "Contact phone number.",
          },
          preferredDate: {
            type: Type.STRING,
            description: "Requested date and time for the appointment.",
          },
        },
        required: ["ownerName", "petName", "phoneNumber", "preferredDate"],
      },
    },
  ],
};

export const createmssg = async (req, res) => {
  const { message, sessionId, context } = req.body;

  if (!sessionId || !message) {
    return res
      .status(400)
      .json({ message: "Session ID and Message are required" });
  }

  try {
    // Find or Create new Session
    let session = await conversation.findOne({ sessionId });

    if (!session) {
      session = await conversation.create({
        sessionId,
        context: context || {},
        messages: [],
      });
    }

    //Prepare History for Gemini
    const history = session.messages
      .filter((m) => m.sender === "user" || m.sender === "bot")
      .map((m) => ({
        role: m.sender === "bot" ? "model" : "user",
        parts: [{ text: m.text }],
      }));

    // Inject Context
    let promptToSend = message;
    if (history.length < 2 && session.context?.petName) {
      promptToSend += ` (System Context: Owner=${session.context.userName}, Pet=${session.context.petName})`;
    }

    // Initialize Chat
    const chat = ai.chats.create({
      model: "gemini-2.0-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [bookAppointmentTool],
        temperature: 0.7,
      },
      history: history,
    });

    //  Send Message to Gemini
    const result = await chat.sendMessage({ message: promptToSend });
    let botResponseText = "";

    // Handle Function Calling
    const functionCalls = result.candidates?.[0]?.content?.parts?.filter(
      (p) => p.functionCall
    );

    if (functionCalls?.length > 0) {
      const call = functionCalls[0].functionCall;

      if (call.name === "book_appointment") {
        const args = call.args;

        // Validate fields
        if (
          !args.ownerName ||
          !args.petName ||
          !args.phoneNumber ||
          !args.preferredDate
        ) {
          botResponseText =
            "I still need your name, pet name, phone number and preferred date to book the appointment.";
        } else {
          // Prevent duplicate booking
          const existing = await appointment.findOne({
            phoneNumber: args.phoneNumber,
          });

          if (existing) {
            botResponseText =
              "An appointment already exists with this phone number.";
          } else {
            // Create appointment
            const newAppointment = await appointment.create({
              ownerName: args.ownerName,
              petName: args.petName,
              phoneNumber: args.phoneNumber,
              preferredDate: args.preferredDate,
              sessionId: sessionId,
            });

            // Send tool response back to Gemini
            const toolResponse = await chat.sendMessage({
              message: [
                {
                  functionResponse: {
                    name: "book_appointment",
                    response: {
                      result: `Appointment successfully booked. ID: ${newAppointment._id}`,
                    },
                  },
                },
              ],
            });

            botResponseText = toolResponse.text;
          }
        }
      }
    }

    // Fallback if no function call happened
    if (!botResponseText) {
      botResponseText = result.text || "Sorry, I couldn't understand that.";
    }

    //Save messages
    session.messages.push({
      id: randomUUID(),
      text: message,
      sender: "user",
      timestamp: new Date(),
    });

    session.messages.push({
      id: randomUUID(),
      text: botResponseText,
      sender: "bot",
      timestamp: new Date(),
    });

    await session.save();

    // Return response
    res.json({
      text: botResponseText,
      sessionId: session.sessionId,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
