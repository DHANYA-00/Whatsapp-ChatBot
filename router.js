import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const router = express.Router();

// Groq client
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Course context
const COURSE_CONTEXT = `
AI Academy Course:

Modules:
1. Introduction to LLM – 10 units
2. Basics of Prompting – 12 units
3. Deep Dive into LLM Integration – 15 units
4. Advanced LLM Concepts and Agentic AI – 17 units

Access:
- Module 1 & 2 are FREE
- Module 3 & 4 cost ₹499

Certificate available after completing all modules.

Pricing: https://ai-academy.example.com/pricing
`;


// ============================
// 🔹 AI RESPONSE FUNCTION
// ============================
async function getAIResponse(userMessage) {
  const response = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content:
          "You are an AI Academy assistant. Answer ONLY using the provided context. If the answer is not in the context, say you don't know.",
      },
      {
        role: "system",
        content: COURSE_CONTEXT,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  return (
    response.choices?.[0]?.message?.content ||
    "I’m not sure based on available information."
  );
}


// ============================
// 🔹 SEND MESSAGE (WHAPI)
// ============================
async function sendMessage(to, message) {
  try {
    await fetch("https://gate.whapi.cloud/messages/text", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHAPI_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: to,
        body: message,
      }),
    });
  } catch (err) {
    console.error("Whapi send error:", err);
  }
}


// ============================
// 🔹 WEBHOOK ENDPOINT
// ============================
router.post("/webhook", async (req, res) => {
  try {
    console.log("Incoming webhook:", JSON.stringify(req.body, null, 2));

    const messageData = req.body.messages?.[0];

    // Ignore if no message
    if (!messageData) {
      return res.sendStatus(200);
    }

    const userMessage = messageData.text?.body;
    const from = messageData.from;

    // Ignore non-text messages
    if (!userMessage) {
      return res.sendStatus(200);
    }

    console.log("User:", from, "| Message:", userMessage);

    // Entry trigger
    if (userMessage === "AI-Academy") {
      await sendMessage(
        from,
        "Thank you for reaching out to the AI Academy! How can I help you today?"
      );
      return res.sendStatus(200);
    }

    // Get AI response
    const reply = await getAIResponse(userMessage);

    console.log("Bot reply:", reply);

    // Send back to user
    await sendMessage(from, reply);

    return res.sendStatus(200);

  } catch (error) {
    console.error("Webhook ERROR:", error);
    return res.sendStatus(500);
  }
});


// ============================
// 🔹 OPTIONAL TEST ROUTE
// ============================
router.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ error: "Message is required" });
    }

    const reply = await getAIResponse(userMessage);

    return res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;