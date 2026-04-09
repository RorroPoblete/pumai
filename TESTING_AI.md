# Testing AI Agents - Step by Step

## Prerequisites

- App running on http://localhost:3000
- OPENAI_API_KEY configured in `.env` (root) and `app/.env.local`
- Docker containers up: `docker compose up -d`

---

## Step 1: Login

1. Go to http://localhost:3000/login
2. Use demo credentials:
   - **Email:** `demo@pumai.com.au`
   - **Password:** `password123`

---

## Step 2: Go to AI Agents

1. Click **"AI Agents"** in the sidebar
2. You'll see 5 pre-configured agents: Sam, Alex, Jordan, Support Bot, Bookings

---

## Step 3: Test an Existing Agent

1. Click **"Test"** on the agent **"Sam"** (Healthcare, Professional tone)
2. Click the **"Test"** tab at the top
3. Type a message in the chat input, for example:

```
Hi, I'd like to book a dental appointment for next week
```

4. Press Enter or click the send button
5. You'll see the AI respond in real-time (streaming) using Sam's system prompt and professional tone

### Try these test conversations:

**Sam (Healthcare - Professional):**
```
- "What are your opening hours?"
- "I need to reschedule my appointment tomorrow"
- "How much does a dental cleaning cost?"
- "I'm having severe tooth pain, what should I do?"
```

**Alex (Real Estate - Friendly):**
```
- "I'm looking for a 3-bedroom house in Bondi"
- "What's the average price in Surry Hills?"
- "Can I schedule a property inspection this Saturday?"
- "I just got pre-approved for $1.2M, what can I find?"
```

**Jordan (Automotive - Casual):**
```
- "Hey, I'm interested in test driving the new Camry"
- "What's the trade-in value for a 2020 Mazda 3?"
- "My car needs a 60,000km service, how much?"
- "Do you have any deals on SUVs right now?"
```

---

## Step 4: Create a Custom Agent

1. Go to **AI Agents** > click **"New Agent"**
2. Fill in:
   - **Name:** `Cafe Bot`
   - **Tone:** Friendly
   - **Industry:** Hospitality
3. Go to **"System Prompt"** tab, click **"Apply Hospitality template"** or write:

```
You are Cafe Bot, a friendly assistant for The Aussie Bean, 
a cafe in Melbourne CBD. 

Opening hours: Mon-Fri 7am-4pm, Sat-Sun 8am-3pm.
Address: 123 Collins Street, Melbourne VIC 3000.

Menu highlights:
- Flat white $5.50
- Smashed avo on sourdough $18
- Acai bowl $16
- Brekkie burger $15

You take orders, answer menu questions, and help with 
catering enquiries. For catering orders over $200, 
ask for their email to send a quote.
```

4. Go to **"Knowledge Base"** tab, add:

```
# FAQs

Q: Do you have wifi?
A: Yes! Free wifi, password: aussiebean2024

Q: Do you cater for events?
A: Yes! We offer catering for groups of 10+. Minimum order $200.

Q: Are you dog friendly?
A: We have outdoor seating that is dog friendly.

Q: Allergies?
A: We cater for gluten-free, dairy-free, and vegan. Please let us know.

# Specials
- Monday: $12 brekkie combo (any toast + coffee)
- Wednesday: 2-for-1 flat whites before 9am
```

5. Click **"Create Agent"**
6. Go to the **"Test"** tab
7. Try these messages:

```
- "Hey! What's on the menu?"
- "Do you have any vegan options?"
- "I need catering for 20 people next Friday"
- "What's the wifi password?"
- "Are you open on Sundays?"
```

---

## Step 5: Test Tone Differences

Create 3 agents with the SAME system prompt but different tones to see how the AI adapts:

1. Clone the Cafe Bot concept with **Professional** tone
2. Clone it again with **Casual** tone  
3. Send the same message to all 3: `"Hey, what coffee do you recommend?"`

Notice how each one responds differently based on the tone setting.

---

## Step 6: Test Edge Cases

Try these to see how the AI handles tricky scenarios:

```
- "I want to speak to a manager" (escalation)
- "This is terrible service, I'm leaving a 1-star review" (negative sentiment)
- "Can you give me a discount?" (out of scope)
- "What's the weather today?" (off-topic)
- Send a very long message with multiple questions
- Send just "hi"
```

---

## How It Works

```
User sends message
  -> POST /api/chat
  -> Builds system prompt:
     1. Agent identity + name
     2. Tone instructions (Professional/Friendly/Casual)
     3. Australian SMS/chat style guidelines
     4. Custom system prompt (from editor)
     5. Knowledge base (FAQs, business info)
  -> Sends to OpenAI GPT-4o Mini (streaming)
  -> Response streams back to chat UI in real-time
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Failed to get response" | Check OPENAI_API_KEY is set correctly |
| No response / timeout | Check Docker logs: `docker compose logs app` |
| API key error | Verify key at https://platform.openai.com/api-keys |
| Rebuild needed | `docker compose up -d --build app` |
