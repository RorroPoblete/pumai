# WhatsApp Integration Guide (via Whapi.cloud)

## Prerequisites

- A WhatsApp account (personal or business — Whapi supports both)
- Docker running with PumAI (`docker compose up --build`)
- ngrok installed (`brew install ngrok`)
- A Whapi.cloud account (free sandbox available)

---

## Step 1: Create a Whapi Channel

1. Sign up at https://whapi.cloud
2. In the dashboard, click **"Create Channel"**
3. Scan the QR code with your WhatsApp app (**Linked Devices → Link a Device**)
4. Wait for the channel status to turn **green (Connected)**
5. Copy your:
   - **Channel ID** — shown at the top of the dashboard (e.g. `FALCON-7F7YK`)
   - **API Token** — shown below the channel name (e.g. `s1rrHTFE2Xh...`)

> The free sandbox plan allows 150 messages and 5 chats. Remove limits by upgrading.

---

## Step 2: Start ngrok

```bash
ngrok http 3002
```

Copy the HTTPS URL (e.g. `https://xxxx-xxx.ngrok-free.app`)

---

## Step 3: Configure Webhook in Whapi

1. In your Whapi channel dashboard, click **"Settings"** (top right)
2. Find **"Webhook URL"** and set it to:
   ```
   https://YOUR-NGROK-URL/api/webhooks/whatsapp
   ```
3. Under **"Events"**, enable: **`messages`**
4. Click **"Save"**
5. Use **"Test Webhook"** (`POST /settings/webhook_test`) to verify connectivity — you should see `{"status":"ok"}` in the response

---

## Step 4: Configure PumAI

1. Login to the dashboard (`http://localhost:3002`)
2. Go to **Channels** in the sidebar
3. Click **"Connect"** on **WhatsApp**
4. Fill in:
   - **Whapi Channel ID:** e.g. `FALCON-7F7YK`
   - **Whapi API Token:** your token from Step 1
   - **Default Agent:** select an active agent
5. Click **"Connect WhatsApp"**

---

## Step 5: Test

1. From **another phone**, send a WhatsApp message to your linked number
2. The AI agent should reply automatically within a few seconds
3. The conversation appears in the PumAI **Conversations** dashboard with a WhatsApp badge

---

## Architecture

```
WhatsApp User sends message
       ↓
Whapi.cloud receives it, sends webhook POST → /api/webhooks/whatsapp
       ↓
whatsappAdapter.parseInbound() → normalized InboundMessage
  - filters from_me=false and type="text"
  - maps channel_id → externalPageId (identifies business)
  - maps from (phone) → senderExternalId
  - maps text.body → messageText
       ↓
pipeline.handleInbound():
  1. Find ChannelConfig by channel_id → identifies business
  2. Deduplicate by message ID
  3. Upsert conversation (by phone number)
  4. Save inbound message
  5. Generate AI response (getChatResponse)
  6. Send reply via Whapi REST API (gate.whapi.cloud/messages/text)
  7. Save outbound message
  8. Async sentiment analysis
       ↓
WhatsApp User receives AI reply
```

---

## Key Files

| File | Purpose |
|------|---------|
| `backend/src/channels/whatsapp.ts` | WhatsApp adapter (parse + send) |
| `backend/src/channels/pipeline.ts` | Unified inbound pipeline (shared with all channels) |
| `backend/src/channels/registry.ts` | Channel → adapter lookup |
| `frontend/src/app/api/webhooks/whatsapp/route.ts` | Webhook endpoint |
| `backend/src/channel-actions.ts` | Connect/disconnect/toggle channels |

---

## Credentials Shape (stored in `ChannelConfig.credentials`)

```json
{
  "apiToken": "your_whapi_api_token"
}
```

The `ChannelConfig.externalId` stores the Whapi **Channel ID** (e.g. `FALCON-7F7YK`), used to match incoming webhooks to the correct business.

---

## Troubleshooting

**Webhook not firing:**
- Make sure ngrok is running and the URL is up to date in Whapi Settings
- Use the **"Test Webhook"** button in Whapi to verify the endpoint responds
- Check `docker compose logs -f app` for errors

**Messages arriving but no AI reply:**
- Verify the ChannelConfig exists in the dashboard and `active: true`
- Check `OPENAI_API_KEY` is set in `.env`
- Make sure the assigned agent has a system prompt

**"No adapter for channel: WHATSAPP" error:**
- Rebuild Docker: `docker compose down && docker compose up --build`

**Sandbox limits:**
- Free plan: 150 messages / 5 chats max
- Remove limits at https://whapi.cloud/billing

**Session expires:**
- Whapi keeps the WhatsApp session alive as long as you open the WhatsApp mobile app at least once every 14 days
- If the session drops, re-scan the QR code in your Whapi dashboard
