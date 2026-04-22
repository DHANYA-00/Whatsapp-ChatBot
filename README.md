# WhatsApp AI Chatbot – AI Academy

A WhatsApp chatbot that answers user queries about an AI Academy course using an LLM (via Groq). It integrates with WhatsApp through Whapi and processes user messages in real-time.

---

## System Flow

```
User (WhatsApp)
   ↓
Whapi (Webhook Trigger)
   ↓
Backend (/api/webhook)
   ↓
AI Model (Groq)
   ↓
Whapi (Send Response)
   ↓
User (WhatsApp Reply)
```

---

## How It Works

1. User sends a message on WhatsApp
2. Whapi receives the message and forwards it to the webhook: `POST /api/webhook`
3. The backend extracts the user message and phone number
4. Decision logic runs:
   - If message is `AI-Academy` → send a greeting
   - Otherwise → forward to AI model
5. The AI model generates a response using a system prompt and course context
6. The backend sends the reply back to the user via the Whapi API

---

## Features

- **AI-Powered Responses** — Integrated Groq API via the OpenAI-compatible SDK; answers are grounded in predefined course data to prevent hallucination
- **WhatsApp Integration** — Real-time message handling via Whapi webhook
- **Context Restriction** — AI only answers from provided course data
- **Entry Trigger** — Sending `AI-Academy` returns a welcome/greeting message
- **Error Handling** — Ignores empty or non-text messages; always returns `200 OK` to prevent Whapi retries

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| LLM Provider | Groq |
| LLM Client | OpenAI SDK (compatible) |
| WhatsApp API | Whapi |
| HTTP Client | Fetch API (native) |

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <project-folder>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key
WHAPI_TOKEN=your_whapi_token
PORT=5000
```

### 4. Start the server

```bash
node index.js
```

### 5. Expose the webhook

Use a tunneling tool like [ngrok](https://ngrok.com/) to expose your local server:

```bash
ngrok http 5000
```

Then set the public URL as your webhook in the Whapi dashboard:

```
POST https://<your-ngrok-url>/api/webhook
```

---

## API Endpoints

### `POST /api/webhook`
Main handler for incoming WhatsApp messages from Whapi.

**Sample Payload:**
```json
{
  "messages": [
    {
      "from": "919xxxxxxxxx",
      "text": {
        "body": "AI-Academy"
      }
    }
  ]
}
```

---

### `POST /api/chat`
Optional test endpoint for local development.

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is this course about?"}'
```

---

## Known Limitations

- No conversation memory (stateless)
- No user session tracking
- No database integration
- Responses are limited to predefined course context

---

## Roadmap

- [ ] Add per-user conversation memory
- [ ] Persist chat history with Redis or MongoDB
- [ ] Improve prompt engineering
- [ ] Add multi-language support
- [ ] Add analytics and logging

---

## Deployment

The backend is a standard Node.js/Express app and can be deployed to any platform that supports persistent processes (e.g., Railway, Render, VPS). Note that **serverless platforms like Vercel are not recommended** due to stateless limitations and cold-start issues with webhooks.

## Deployment Link

`https://whatsapp-chatbot-1-0sqj.onrender.com`

## Whatsapp Chat Link: `https://wa.me/919790776763?text=Start`