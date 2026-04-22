# Low-Level Design (LLD) – WhatsApp AI Chatbot

---

## 1. Components

### 1.1 Webhook Controller

The entry point for all incoming messages. Responsible for:
- Parsing the incoming `req.body` from Whapi
- Extracting `userMessage` and `userPhone`
- Routing to the appropriate handler (greeting or AI)
- Always returning `200 OK` to prevent Whapi from retrying

### 1.2 AI Service

**Function:** `getAIResponse(userMessage)`

Responsibilities:
- Sends request to the Groq API using the OpenAI-compatible SDK
- Injects the system prompt and course context into the request
- Returns the AI-generated response string

### 1.3 Messaging Service

**Function:** `sendMessage(to, message)`

Responsibilities:
- Calls the Whapi REST API
- Sends the bot reply to the user's phone number

### 1.4 Routing Layer

```
/api/webhook  →  Main message handler (production)
/api/chat     →  Test message handler (development)
```

---

## 2. Data Flow

```
req.body
   ↓
messages[0]
   ↓
text.body → userMessage
from      → userPhone
   ↓
Decision Layer:
   ├── "AI-Academy" → send greeting
   └── anything else → getAIResponse(userMessage)
                              ↓
                        AI Response (string)
                              ↓
                       sendMessage(userPhone, reply)
                              ↓
                          Whapi API
```

---

## 3. Data Structures

### 3.1 Incoming Webhook Payload (from Whapi)

```json
{
  "messages": [
    {
      "from": "919xxxxxxxxx",
      "text": {
        "body": "User message here"
      }
    }
  ]
}
```

### 3.2 Internal Representation

```
userMessage : string  — extracted from messages[0].text.body
userPhone   : string  — extracted from messages[0].from
botReply    : string  — returned by AI service or static greeting
```

### 3.3 Whapi Send Message Payload

```json
{
  "to": "919xxxxxxxxx",
  "body": "Bot reply text"
}
```

---

## 4. Control Flow Logic

```
IF messages[0] does not exist     → ignore, return 200
IF messages[0].text does not exist → ignore, return 200
IF userMessage == "AI-Academy"    → send greeting, return 200
ELSE                              → call getAIResponse → send reply, return 200
```

---

## 5. AI Service – Prompt Design

The Groq API call includes a layered prompt:

| Role | Content |
|---|---|
| `system` | Role definition + strict instruction to only use provided course data |
| `system` | Full course context (FAQ, modules, pricing, etc.) |
| `user` | The actual user message |

This structure keeps the AI grounded in the course content and prevents hallucination.

---

## 6. Error Handling Strategy

| Scenario | Handling |
|---|---|
| Empty or missing message body | Skip silently, return `200` |
| Non-text message type | Skip silently, return `200` |
| Groq API failure | Catch error, return safe fallback message |
| Whapi send failure | Log error, return `200` (message may not deliver) |

The webhook always returns `200 OK`. This is intentional — Whapi will retry any non-200 response, which would cause duplicate processing.

---

## 7. Sequence Diagram

```
User          Whapi         Backend         Groq          Whapi
 │               │               │              │              │
 │── message ──▶│               │              │              │
 │               │── POST ──────▶│              │              │
 │               │    /webhook   │              │              │
 │               │               │── API call ─▶│              │
 │               │               │◀─ response ──│              │
 │               │               │── POST ──────────────────────▶│
 │               │               │    sendMessage               │
 │◀──────────────────────────────────────────── reply ──────────│
```

---

## 8. Scalability Considerations

### Current Architecture (Stateless)

```
User → Webhook → AI Model → Response
```

Every request is independent. No history is stored, so context is lost between messages.

### Target Architecture (Stateful)

```
User → Webhook → Redis (fetch/store history by userPhone)
                      ↓
                  AI Model (with history as context)
                      ↓
                  Response → Redis (append) → User
```

Keying conversation history by `userPhone` enables multi-turn conversations with full context.

---

## 9. Known Design Weaknesses

| Weakness | Impact |
|---|---|
| No memory | Bot cannot carry context across messages; every reply is isolated |
| No rate limiting | A single user can spam the bot and incur unbounded API costs |
| No input validation | Malformed or oversized payloads are not sanitized |
| No observability | No logging, tracing, or alerting on failures |
| Serverless incompatible | Platforms like Vercel may cold-start and miss webhook events |

---

## 10. Suggested Improvements

| Area | Recommendation |
|---|---|
| Memory | Store conversation history in Redis (TTL-keyed by `userPhone`) |
| Persistence | Log all messages to MongoDB for analytics and replay |
| Rate limiting | Add per-phone throttle (e.g., max 10 requests/min) |
| Observability | Integrate structured logging (Winston/Pino) and error tracking (Sentry) |
| Prompt tuning | Add few-shot examples and a fallback phrase for out-of-scope questions |
| Language support | Detect input language and respond accordingly |