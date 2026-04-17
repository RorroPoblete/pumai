# Deuda técnica — PumAI

Registro vivo de deuda acumulada en desarrollo. Cada ítem incluye causa, riesgo y fix sugerido. Ordenado por área.

Última actualización: 2026-04-17

---

## 1. Infraestructura y deploy

- [ ] **Sin dominio propio.** `pumai.cl` / subdominio `cleverg.cl` sin decidir. Bloquea publicación de app Meta y Instagram webhooks reales.
  - Fix: comprar dominio NIC Chile, apuntar a Vercel/Railway.
- [ ] **Sin deploy productivo.** Solo corre local con Docker. ngrok free rota URL en cada restart → Meta webhook falla recurrente.
  - Fix: deploy Next.js a Vercel o Fly.io con SSL estable.
- [ ] **Sin CI/CD.** No hay lint/typecheck/test en PR. Rompe silenciosamente.
  - Fix: GitHub Actions con `tsc --noEmit`, `npm run build`, y cuando haya tests.
- [ ] **Sin tests.** Cero cobertura unitaria/integración/E2E. Refactors cargan riesgo.
  - Fix: Vitest para utils + Playwright para E2E widget + dashboard.

---

## 2. Integración Instagram (stand by)

Ver `docs/integrations/instagram-status-2026-04-16.md` para detalle completo.

- [ ] **App Meta en Dev mode.** Webhooks de DMs reales no llegan.
  - Fix: publicar app → requiere privacy policy + terms + data deletion callback + icon 1024×1024.
- [ ] **Adapter Instagram migrado a Facebook Login API sin testear E2E con DM real.** Último fix aplicado; no probado end-to-end con visitante externo.
- [ ] **Page Access Token expira en ~60 días.** No hay refresh automático ni alerta.
  - Fix: job Cron que chequee `debug_token` y avise al tenant 7 días antes.

---

## 3. Webchat

### Producto
- [ ] **No hay push real-time al widget.** Si el agente responde desde el dashboard, el visitante ve la respuesta solo al abrir el panel o mandar otro mensaje. Dashboard polling 10s (cubre agente → ver mensajes nuevos), pero widget no polea ni escucha.
  - Fix: endpoint SSE para el widget, o WebSocket bidireccional.
- [ ] **Offline mode binario.** Solo off/always. No hay horario de negocio.
  - Fix: agregar `businessHours` en config + lógica auto-offline fuera de horario.
- [ ] **Sin notificación al agente en sidebar** cuando llega mensaje nuevo. Badge unread implementado en lista, falta indicador global en sidebar.
  - Fix: contador global de unread en sidebar (Conversations link).
- [ ] **Sesiones de distintos días del mismo visitante se mergean en una sola conversación.** Por diseño (continuidad), pero dashboard puede dar la sensación de "no se actualiza" si no hay badge de unread (fix aplicado hoy — polling + unread count).

### Widget técnico
- [ ] **Input del widget hereda estilos del sitio host.** Forzamos `color: #1a1a1a` y `background: white`. Sitios con selectores muy agresivos (`input, *`) pueden romper.
  - Fix: migrar a Shadow DOM para aislamiento completo.
- [ ] **Widget no versionado.** `/widget.js` sirve siempre la última. Un breaking change rompe todos los sitios embebidos.
  - Fix: `/widget-v1.js`, `/widget-v2.js` y deprecar en vez de romper.
- [ ] **Imágenes en bubbles no lazy-loaded.** Conversaciones largas cargan todas las imágenes al abrir.
  - Fix: `loading="lazy"` en `<img>`.
- [ ] **AI no ve las imágenes.** Adapter usa `gpt-4o-mini` (solo texto). El prompt le dice al modelo "el cliente mandó una imagen, pregúntale". Pierde valor.
  - Fix: cambiar a modelo con visión (`gpt-4o`) para mensajes con `attachmentUrl`.

### Identificación visitante
- [ ] **Fallback `Visitor #XXXXXX`** usa últimos 6 chars del sessionId. No hay IP, user agent, geolocation.
  - Fix: enriquecer con `req.headers["x-forwarded-for"]`, user agent parse, opcional geolocation por IP (ipapi).
- [ ] **Widget no detecta cambio de usuario.** Si alguien borra localStorage, se crea sessionId nuevo = visitante nuevo. Si dos personas usan el mismo browser, colisionan.
  - Aceptable para MVP. Futuro: login opcional para web.

### Storage
- [ ] **Uploads en volumen Docker local (`/app/uploads`).** No escala, no hay backup, se pierde en `docker compose down -v`.
  - Fix: S3 / Cloudflare R2 con signed URLs.

---

## 4. Arquitectura multi-canal

- [ ] **Código duplicado entre `/api/webchat/[key]/message` y `/stream`.** Find config, upsert conversation, check origin, guardar mensaje. ~80% overlap.
  - Fix: extraer a `webchatInbound(config, body)` compartido.
- [ ] **`handleInbound` (pipeline.ts) duplicado parcialmente en `/stream/route.ts`.** Stream route no usa la función porque necesita AI streaming; copia save/upsert logic.
  - Fix: refactor `handleInbound` para aceptar callback de respuesta AI (stream or buffer) vía parámetro.
- [ ] **Helpers repetidos.** `corsHeaders`, `safeParse`, `json` duplicados en 5+ rutas de `/api/webchat/*`.
  - Fix: `frontend/src/app/api/webchat/_shared.ts`.
- [ ] **`parseBranding` en `channel-queries.ts` duplica validación del zod schema.** Dos fuentes de verdad para defaults.
  - Fix: exportar `webchatConfigSchema.parse` con defaults, reutilizar.
- [ ] **Fallback `"Visitor #" + sessionId.slice(-6).toUpperCase()`** inline en 3 endpoints (stream, message, offline).
  - Fix: función `generateVisitorFallback(sessionId)` compartida.
- [ ] **Adapter WhatsApp no existe.** Phase 10 del README.
- [ ] **Sin sistema de logs centralizado.** `console.log`/`console.error` a docker logs. Errores productivos se pierden.
  - Fix: Sentry o similar.

---

## 5. Schema / datos

- [ ] **Columnas `readAt`, `attachmentUrl`, `attachmentType` aplicadas vía ALTER TABLE crudo, no con `prisma migrate`.** No hay archivo de migración.
  - Fix: crear migration retroactiva con `prisma migrate dev --name add_message_attachments_and_read_at`.
- [ ] **5 conversaciones WEBCHAT de test en DB.** `visitor_test_1`, `sse_test`, `test_off`, etc.
  - Fix: `DELETE FROM "Conversation" WHERE "contactExternalId" LIKE '%test%';` antes de demo.
- [ ] **`Conversation.contactPhone`** se usa para guardar email en webchat. Semántica mezclada.
  - Fix: agregar `contactEmail` al schema.
- [ ] **No hay tabla `DataDeletionRequest`.** Meta la exige al publicar app.
  - Fix: agregar modelo + endpoint POST `/api/meta/data-deletion` + página de status.

---

## 6. Seguridad

- [ ] **Sin rate limiting en endpoints públicos del widget.** `/stream`, `/message`, `/upload`, `/config`, `/seen`, `/offline` aceptan cualquier cantidad de requests.
  - Fix: `rate-limit.ts` (ya existe con Redis) aplicado por `widgetKey + IP`.
- [ ] **CORS refleja `Access-Control-Allow-Origin` del origen del request cuando `allowedOrigins` está vacío.** Equivale a `*`. OK para MVP público pero permite abuse.
  - Fix: default seguro = mismo origin. Whitelist explícita para dominios de clientes.
- [ ] **Upload valida solo MIME + size.** No hay scan de malware ni verificación magic bytes.
  - Fix: verificar magic bytes con `file-type` package; opcional ClamAV.
- [ ] **`widgetKey` sin rotación.** Si se filtra, el atacante puede spam al agente.
  - Fix: botón "Rotate key" en dashboard + versioning.
- [ ] **`sessionId` del visitante en localStorage.** Vulnerable a XSS del sitio host. Si el host tiene XSS, el atacante puede impersonar la sesión.
  - Aceptable: si el sitio host tiene XSS el webchat es el menor problema.
- [ ] **Secretos en `.env` sin rotación documentada.** `AUTH_SECRET`, `META_APP_SECRET`, `OPENAI_API_KEY`.
  - Fix: doc de rotación + considerar vault (Doppler/1Password) para prod.

---

## 7. UX dashboard

- [ ] **Polling 10s para conversaciones.** Cada tenant pega a DB cada 10s independiente del uso. Costoso.
  - Fix: SSE o WebSocket o pausar polling si pestaña está en background (Page Visibility API).
- [ ] **Reply del agente humano no refleja en widget en tiempo real.** Visitante espera que llegue su mensaje.
  - Fix: SSE push al widget (ver punto 3).
- [ ] **Sin agrupación de conversaciones por día.** Todas en una lista plana ordenada por `updatedAt`.
  - Fix: secciones "Hoy", "Ayer", "Esta semana", "Más antiguo".
- [ ] **Sin búsqueda full-text en mensajes.** Solo filtra por nombre del contacto.
  - Fix: Postgres full-text search (`tsvector`) sobre `Message.content`.
- [ ] **Sin archivar / borrar conversaciones.** Acumulan sin límite.
  - Fix: botón archive + vista filtro.

---

## 8. Marketing / onboarding

- [ ] **Sin wizard post-signup** que guíe a embed el widget. Cliente nuevo entra al dashboard y no sabe por dónde empezar.
  - Fix: tour interactivo (ej. `react-joyride`) o checklist "Getting started" en sidebar.
- [ ] **Snippet de embed no tiene instrucciones por CMS.** Wordpress/Shopify/Webflow/Wix requieren pasos distintos.
  - Fix: tabs con copy-paste por plataforma + screenshots.
- [ ] **No hay preview del widget dentro del dashboard** antes de copiar snippet.
  - Fix: iframe en la página Channels → Webchat que carga el widget con el config actual.

---

## 9. Billing (Phase 13 pendiente)

- [ ] **Sin Stripe.**
- [ ] **Sin tracking de uso** (mensajes/conversaciones por tenant).
- [ ] **Sin límites por plan aplicados** (los `PLAN_LIMITS` en queries.ts son solo para display).

---

## 10. Compliance (Phase 14 pendiente)

- [ ] **Sin privacy policy** pública.
- [ ] **Sin terms of service** público.
- [ ] **Sin mecanismo de opt-out** para mensajes de marketing (Spam Act 2003 AU).
- [ ] **Sin disclosure AI** — mandatorio en Australia decir "respondes a un bot".
  - Fix: badge pequeño "Powered by AI" en el widget o welcome message.
- [ ] **Sin breach notification flow** (Privacy Act 1988).

---

## Priorización sugerida (próximos 2 sprints)

**P0 (bloquea producción):**
1. Deploy a Vercel + dominio (Instagram + marketing dependen)
2. Privacy/Terms/Data deletion (legal + Instagram App Review)
3. Rate limiting en webchat endpoints
4. Migrar uploads a S3/R2

**P1 (calidad de producto):**
5. SSE push al widget para reply del agente
6. Refactor código duplicado entre rutas webchat
7. Sentry + logs estructurados
8. Tests mínimos E2E (signup → crear agente → embed widget → chat funciona)

**P2 (nice to have):**
9. Shadow DOM del widget
10. Vision model para imágenes
11. Wizard onboarding + preview widget
12. Stripe billing
