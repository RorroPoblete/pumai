# Facebook Messenger Integration Guide

## Prerequisites

- A Facebook account with admin access to a Facebook Page
- Docker running with PumAI (`docker compose up --build`)
- ngrok installed (`brew install ngrok`)

---

## Step 1: Create a Meta Developer App

1. Go to https://developers.facebook.com
2. Click **"My Apps"** → **"Create App"**
3. Select app type: **"Business"**
4. Name it (e.g. "PumAI") and create
5. Go to **App Settings → Basic**
6. Copy the **App Secret**

## Step 2: Add Messenger Product

1. In the app dashboard, click **"Add Product"**
2. Find **"Messenger"** and click **"Set Up"**
3. Under **"Access Tokens"**, connect your **Facebook Page**
4. Click **"Generate Token"** for that Page
5. Copy the **Page Access Token** and **Page ID**

## Step 3: Start ngrok

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g. `https://xxxx-xxx.ngrok-free.app`)

## Step 4: Configure Webhook in Meta

1. In Messenger Settings → **Webhooks** → **"Edit Callback URL"**
2. Set:
   - **Callback URL:** `https://YOUR-NGROK-URL/api/webhooks/meta`
   - **Verify Token:** `pumai_webhook_verify_2024` (or whatever you set)
3. Click **"Verify and Save"**
4. Under **"Page Subscriptions"**, enable: **`messages`**

## Step 5: Configure PumAI

### Option A: Via Superadmin Dashboard

1. Login as `admin@pumai.com.au` / `password123`
2. Go to **Platform** in the sidebar
3. Enter the **App Secret** and **Webhook Verify Token** → Save
4. Click **"+ Connect Channel"**:
   - **Tenant:** Select the business
   - **Channel:** Facebook Messenger
   - **Page ID:** Your Facebook Page ID
   - **Page Access Token:** The token from Step 2
   - **Default Agent:** Select an active agent
5. Click **"Connect Channel"**

### Option B: Via Tenant Dashboard

1. Login as a business owner
2. Go to **Channels** in the sidebar
3. Click **"Connect"** on Facebook Messenger
4. Enter **Page ID**, **Page Access Token**, and select an **Agent**
5. Click **"Connect Facebook Messenger"**

### Option C: Via Environment Variables

Add to `.env`:

```
META_APP_SECRET=your_app_secret
META_WEBHOOK_VERIFY_TOKEN=your_verify_token
```

Then connect the channel via the dashboard (tokens are per-business, always stored in DB).

## Step 6: Test

1. From another Facebook account (or your own if you're an app admin/tester), go to your Facebook Page
2. Click **"Send Message"**
3. Write something → the AI agent should reply automatically

---

## Architecture

```
Facebook User sends message
       ↓
Meta sends webhook POST → /api/webhooks/meta
       ↓
HMAC-SHA256 signature verified
       ↓
messengerAdapter.parseInbound() → normalized InboundMessage
       ↓
pipeline.handleInbound():
  1. Find ChannelConfig by Page ID → identifies business
  2. Deduplicate by message ID
  3. Fetch sender name via Graph API
  4. Upsert conversation (by PSID)
  5. Save inbound message
  6. Generate AI response
  7. Send reply via Graph API
  8. Save outbound message
  9. Async sentiment analysis
       ↓
Facebook User receives AI reply
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/src/channels/types.ts` | Channel interfaces |
| `backend/src/channels/messenger.ts` | Messenger adapter (parse + send + fetch name) |
| `backend/src/channels/pipeline.ts` | Unified inbound pipeline |
| `backend/src/channels/registry.ts` | Channel → adapter lookup |
| `backend/src/channels/meta-config.ts` | Meta credentials resolver (DB + env fallback) |
| `frontend/src/app/api/webhooks/meta/route.ts` | Webhook endpoint (verify + receive) |
| `backend/src/channel-actions.ts` | Connect/disconnect/toggle channels |
| `backend/src/channel-queries.ts` | Query channel configs |

## Troubleshooting

**Webhook verification fails:**
- Check `META_WEBHOOK_VERIFY_TOKEN` matches between PumAI and Meta console
- Make sure ngrok is running and the URL is correct

**Messages not arriving:**
- Check `docker compose logs -f app` for errors
- Verify the `messages` subscription is enabled in Meta
- Make sure the ChannelConfig exists and `active: true`

**AI not responding:**
- Check `OPENAI_API_KEY` is set
- Check there's an active agent assigned to the channel
- Look for `[Pipeline]` errors in the logs

**"Unknown" contact name:**
- The app fetches names via Graph API. In dev mode, this requires the sender to be an app admin/tester
- Names are fetched on first message and cached in the conversation

**Dev mode limitations:**
- Only app admins, developers, and testers can message the Page
- Add testers in Meta Console → **App Roles → Roles**
- To go live: submit the app for Meta review
