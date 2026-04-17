# Webchat Integration Guide

## Prerequisites

- Docker running with PumAI (`docker compose up --build`)
- An active AI agent in the business (create one in `/dashboard/agents`)
- Nothing external — the widget is hosted by PumAI itself

---

## Step 1: Connect Webchat in the Dashboard

1. Login at http://localhost:3002 with `demo@pumai.com.au` / `password123`
2. Go to **Channels** in the sidebar
3. Find **Webchat Widget** → click **Connect**
4. Fill the form:
   - **Agent** — the AI agent that answers visitors
   - **Position** — bottom right (default) or bottom left
   - **Title** — the header text (e.g. "PumAI", "Support")
   - **Primary color** — hex color picker (matches your brand)
   - **Welcome message** — first message the bot says when panel opens
   - **Visitor form** — Off / Ask-allow-skip / Required (captures name + email)
   - **Offline mode** — Live chat (AI replies) / Offline (captures email, async)
   - **Allowed origins** — one domain per line (empty = any origin)
5. Click **Create widget** → a `widgetKey` is generated server-side
6. Copy the **embed snippet** shown below the channel card

## Step 2: Embed on Any Site

Paste the snippet before the closing `</body>` tag:

```html
<script src="https://your-domain.com/widget.js" data-widget-key="wk_abc123..." async></script>
```

The widget injects a floating chat button in the configured corner. No framework or build step needed on the client site.

## Step 3: Test

1. Open any page where you embedded the snippet
2. Click the floating button → chat panel opens
3. Type a message → AI response streams back token-by-token
4. Conversations appear in **Dashboard → Conversations** with channel `WEBCHAT`

---

## Architecture

```
Visitor opens site
       ↓
widget.js fetches /api/webchat/:key/config → branding, mode
       ↓
Panel opens → POST /api/webchat/:key/seen (marks agent msgs read)
       ↓
Visitor types → POST /api/webchat/:key/stream (SSE)
       ↓
Server:
  1. Find ChannelConfig by widgetKey → identifies business + agent
  2. Validate origin against allowedOrigins
  3. Upsert Conversation by sessionId (localStorage UUID)
  4. Save inbound Message (USER) with optional attachment
  5. Stream AI tokens via OpenAI → emit SSE data: {type:"token"} events
  6. On stream end: save outbound Message (AGENT), mark user msgs read
  7. Emit data: {type:"done"} event + kick off sentiment analysis
       ↓
Widget renders tokens progressively in agent bubble
```

### Modes

| Mode | Behavior |
|------|----------|
| Live (default) | AI replies in real time via SSE streaming |
| Visitor form required | Asks name+email before chat; blocks if empty name |
| Visitor form optional | Asks name+email; visitor can skip |
| Offline | Shows email + message form; creates conversation with `aiEnabled=false`. Business replies later from `/dashboard/conversations`. |

### File attachments

- Paperclip button in the input bar → native file picker
- Allowed: PNG, JPEG, WEBP, GIF, max 2 MB
- Upload to `/api/webchat/:key/upload` → saved to `uploads_data` Docker volume at `/app/uploads`
- Served via `/api/uploads/:filename`
- Message saved with `attachmentUrl` + `attachmentType`
- Text field optional when an attachment is present
- AI is prompted to acknowledge the image (current model can't see it; future: vision model)

### Read receipts

- `Message.readAt` tracks when each message was read by the opposite party
- Widget calls `/seen` on panel open → marks all AGENT messages read
- Pipeline / dashboard reply marks all USER messages read when the agent responds

### Streaming

- Primary path: `POST /api/webchat/:key/stream` returns `text/event-stream`
- Falls back to `POST /api/webchat/:key/message` (buffered JSON) if streaming fails
- Both paths share the same find-config / upsert-conversation / save-message logic

---

## Key Files

| File | Purpose |
|------|---------|
| `backend/src/channels/webchat.ts` | No-op adapter (Webchat delivers via HTTP response, not push) |
| `backend/src/channels/pipeline.ts` | Shared `handleInbound` used by `/message` (non-streaming) |
| `backend/src/channels/registry.ts` | Maps `WEBCHAT` → `webchatAdapter` |
| `backend/src/channel-queries.ts` | `parseBranding` reads branding/visitor/offline/origins from credentials JSON |
| `backend/src/channel-actions.ts` | `saveWebchat` server action generates `widgetKey` and upserts ChannelConfig |
| `backend/src/validation.ts` | `webchatConfigSchema` (zod) |
| `frontend/src/app/(app)/dashboard/channels/channel-manager.tsx` | Channel list + embed snippet component |
| `frontend/src/app/(app)/dashboard/channels/webchat-form.tsx` | Branding / visitor / offline config form |
| `frontend/src/app/api/webchat/[widgetKey]/config/route.ts` | GET public branding for widget |
| `frontend/src/app/api/webchat/[widgetKey]/message/route.ts` | POST non-streaming message (fallback) |
| `frontend/src/app/api/webchat/[widgetKey]/stream/route.ts` | POST SSE streaming message |
| `frontend/src/app/api/webchat/[widgetKey]/seen/route.ts` | POST mark agent messages read |
| `frontend/src/app/api/webchat/[widgetKey]/offline/route.ts` | POST offline submission (email + message, no AI) |
| `frontend/src/app/api/webchat/[widgetKey]/upload/route.ts` | POST multipart upload |
| `frontend/src/app/api/uploads/[filename]/route.ts` | GET serve uploaded files |
| `frontend/public/widget.js` | Embeddable vanilla-JS widget (no framework) |

---

## Data Model

Reuses existing `ChannelConfig` with `channel = WEBCHAT`:

- `externalId` — the public `widgetKey` (e.g. `wk_abc123...`) exposed in the `<script>` tag
- `agentId` — the AI agent that answers
- `credentials` — JSON:
  ```json
  {
    "branding": {
      "primaryColor": "#8B5CF6",
      "title": "Chat",
      "welcomeMessage": "Hi! How can we help?",
      "position": "right",
      "collectVisitor": "off",
      "offlineMode": "off"
    },
    "allowedOrigins": []
  }
  ```

Conversations use `contactExternalId = sessionId` from visitor's localStorage.

`Message` table has three new optional columns:

- `attachmentUrl` — relative URL like `/api/uploads/abc.png`
- `attachmentType` — MIME string
- `readAt` — timestamp when the message was read by the other side

---

## Security Notes

- Widget key is public. It identifies which widget to load but not who can read conversations.
- `allowedOrigins` restricts which sites can POST messages. Empty = any (OK for dev, set to production domains before launch).
- Upload endpoint validates MIME type and size limit.
- Visitor form data is optional; the business decides in config.
- CORS headers are emitted on every webchat route so the widget can be hosted on any origin.

---

## Troubleshooting

**Widget button doesn't appear:**
- Open DevTools → Console. A message `[PumAI Widget]` shows config-fetch errors.
- Verify `data-widget-key` attribute matches the one in DB (`SELECT "externalId" FROM "ChannelConfig" WHERE channel='WEBCHAT'`)
- Confirm the script URL resolves (check Network tab for 200 on `/widget.js`)

**Input text is invisible on the site:**
- The widget forces `color: #1a1a1a` and `background: white` for inputs to override dark host themes.
- If a host site has extremely aggressive `input, *` selectors, wrap the widget in a shadow DOM (future work).

**Streaming doesn't stream (response appears all at once):**
- Check that no CDN / proxy buffers the response. Vercel/Cloudflare can buffer SSE unless streaming is enabled.
- `X-Accel-Buffering: no` is already set in the response headers.

**Messages not saving / AI not responding:**
- `docker compose logs -f app | grep -iE 'webchat|pipeline'`
- Check the agent assigned to the widget is `status = ACTIVE`
- Verify `OPENAI_API_KEY` is configured

**Upload returns 404 after widget restart:**
- Files are stored in the `uploads_data` Docker volume. Deleting the volume wipes uploads.
- `docker compose down -v` removes volumes; use `down` alone to keep them.

**Origin blocked:**
- If `allowedOrigins` is set, requests from other domains return 403.
- Leave the field empty to allow any origin, or add the full origin (scheme + host, no path).

**Dashboard "Configure" button doesn't pre-fill branding:**
- `getChannelConfigs` reads credentials JSON for WEBCHAT only. If the JSON is corrupt, defaults are used.

---

## Limitations (future work)

- Only image attachments. No PDFs, videos, audio.
- AI doesn't actually see uploaded images (text model). Plug in a vision model for real image understanding.
- No WebSocket push: when a human agent replies from the dashboard, the visitor sees the reply only on next panel open / next message. Real-time visitor push would require WebSocket or long-poll.
- No rate limiting on public endpoints. Add Redis-backed limiter before production.
- No auto-close based on business hours. `offlineMode` is binary (off / always). Add schedule-aware logic if needed.
- File uploads stored on local volume. Move to S3 / R2 for production scale.
