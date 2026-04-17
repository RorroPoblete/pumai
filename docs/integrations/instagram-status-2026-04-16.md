# Integración Instagram DMs — Estado y bloqueadores

## Resumen ejecutivo

El objetivo es recibir DMs de Instagram en PumAI vía webhooks de Meta y responder automáticamente con el agente de IA del tenant. El código del adapter y del pipeline está funcionando correctamente: endpoint verifica firma HMAC, parsea ambos formatos de payload (`messaging[]` y `changes[]`) y dispara el flujo de respuesta. El bloqueador es que Meta no entrega webhooks de DMs reales mientras la app está en modo Development, aun con tester aceptado y cuenta Business correctamente linkeada a Page. El próximo paso concreto es conseguir dominio propio con HTTPS estable para alojar las páginas legales y el callback de borrado de datos que Meta exige para pasar la app a modo Live.

## Contexto técnico

### Arquitectura

- Stack: Next.js 16 + Prisma + Postgres + docker-compose
- Webhook endpoint: `/api/webhooks/meta` (HMAC-SHA256 verify)
- Adapter: `backend/src/channels/instagram.ts`
- Pipeline: `backend/src/channels/pipeline.ts` (`handleInbound`)
- Exposición local: ngrok free plan

### Entidades Meta involucradas

| Entidad | ID | Descripción |
|---------|-----|-------------|
| App Meta PumAI | 2683021305424602 | App de desarrollador donde se configura IG Messaging |
| Facebook Page | 592289943976769 | Página "Rodrigo Poblete Durruty Ingenieria E Inversiones" linkeada al IGBA |
| Instagram Business Account (IGBA) | 17841473845424576 | Cuenta `@rpd_ingenieria` en modo Business |
| Business Portfolio | 1114391120357690 | Portfolio que agrupa Page + IGBA + App |
| Cuenta tester sender | `@rorropoblete37` | Cuenta personal de Instagram usada para enviar DMs de prueba |

### Credenciales en uso

- Page Access Token (`EAAm...`) válido, 7 scopes, expira aproximadamente en 60 días
- Verify token: `pumai_webhook_verify_2024`
- `META_APP_SECRET` configurado en env

## Lo que está funcionando

- ✅ Cuenta IG `@rpd_ingenieria` en modo Business
- ✅ Link Page ↔ IG confirmado vía Graph API (`/me?fields=instagram_business_account` retorna el IGBA correcto)
- ✅ Usuario Rodrigo Poblete como Administrator de la app PumAI
- ✅ Cuenta `@rpd_ingenieria` aceptada como "Evaluador de Instagram"
- ✅ Los 7 permisos Messenger + Instagram activados como "Listo para la prueba" (Standard Access):
  - `instagram_basic`
  - `instagram_manage_messages`
  - `pages_messaging`
  - `pages_read_engagement`
  - `pages_show_list`
  - `pages_manage_metadata`
  - `business_management`
- ✅ Page Access Token generado vía Graph API Explorer, `type=PAGE`, `is_valid=true`
- ✅ Page suscrita vía `POST /{page-id}/subscribed_apps` con fields: `messages`, `messaging_postbacks`, `message_reads`, `message_reactions`, `messaging_referrals`
- ✅ Webhook GET verification → 200 OK
- ✅ Botón "Probar" del dashboard Meta → llega POST al endpoint correctamente
- ✅ Adapter parsea ambos formatos: `entry.messaging[]` y `entry.changes[]` (field `messages`)
- ✅ Read receipts webhooks llegan al endpoint en formato `messaging[]`

## Lo que NO está funcionando

- DMs reales de texto enviados desde `@rorropoblete37` → `@rpd_ingenieria` no disparan webhook
- ngrok muestra cero POSTs para mensajes de texto reales (solo read receipts y el botón Probar)
- Mensajes sí llegan al inbox principal de Instagram (no a solicitudes), pero Meta no los notifica vía webhook

## Causa raíz identificada

El caso de uso "Administrar mensajes y contenido en Instagram" en el dashboard de Meta muestra textualmente:

> "Para recibir webhooks, la app debe estar publicada."

Esto significa que el flujo moderno de Instagram Messaging API (vía Instagram Login API con scopes `instagram_business_*`) NO entrega webhooks de DMs reales mientras la app está en modo Development, incluso con testers aceptados. Este comportamiento es distinto al flujo Messenger clásico (vía Facebook Login for Business) donde Dev mode + testers sí funciona.

Diagnósticos descartados durante el debug:

- Token inválido o sin scopes → token validado con `debug_token`, 7 scopes presentes
- Page ↔ IG mal linkeado → confirmado link correcto vía `/me` endpoint
- Sender no tester → `rorropoblete37` figura como Evaluador aceptado
- Cuentas en mismo Accounts Center (hipótesis descartada, no documentada)
- Suscripción de webhook mal configurada → `/subscribed_apps` devuelve PumAI con `messages` activo
- Formato de payload no parseado → adapter soporta ambos formatos

## Bloqueadores para publicar la app

Meta requiere los siguientes recursos hosteados en URLs HTTPS públicas y estables antes de permitir publicación:

1. **Privacy Policy URL** — página pública con política de privacidad en español, cubriendo datos recolectados vía Meta, finalidad, derechos del titular acorde a Ley 19.628 de Chile
2. **Terms of Service URL** — términos y condiciones del servicio
3. **Data Deletion Callback URL** — endpoint POST que Meta invoca cuando un usuario solicita borrar sus datos. Debe validar `signed_request` con `APP_SECRET` y responder con URL de status + confirmation code
4. **App Icon 1024x1024** — icono cuadrado de la app
5. **Category** seleccionada en Configuración básica
6. **Dominio estable** — ngrok free no sirve porque el subdomain cambia en cada restart; Meta revisita las URLs periódicamente

## Plan pendiente (en orden)

### Fase 1 — Infraestructura (antes de cualquier cosa de Meta)

1. Comprar dominio propio (`pumai.cl` en NIC Chile, ~$10.000 CLP/año) — DECISIÓN PENDIENTE entre dominio nuevo vs subdominio de `cleverg.cl`
2. Deployar frontend Next.js a Vercel / Railway / Fly apuntando al dominio con SSL
3. Configurar variable `NEXT_PUBLIC_APP_URL` con el dominio de producción

### Fase 2 — Recursos legales

1. Crear páginas `/legal/privacy` y `/legal/terms` en Next.js
2. Implementar endpoint `POST /api/meta/data-deletion` con validación de `signed_request`
3. Crear migration Prisma para tabla `DataDeletionRequest` (`id`, `metaUserId`, `requestedAt`, `status`, `confirmationCode`)
4. Crear página `/legal/data-deletion-status?code=<uuid>`
5. Generar app icon 1024x1024

### Fase 3 — Publicación Meta

1. Pegar URLs en `developers.facebook.com` → PumAI → Configuración básica
2. Pegar Data Deletion Callback en User Data Deletion
3. Seleccionar Category
4. Toggle "Publicar" en el sidebar izquierdo de la app
5. Verificar que el banner "Para recibir webhooks, la app debe estar publicada" desaparezca
6. Probar DM real `rorropoblete37` → `rpd_ingenieria` y confirmar POST en ngrok / logs

### Fase 4 — App Review (futuro, para producción con público general)

- Requerido solo si se quiere recibir DMs de cuentas no-tester
- Permiso a solicitar: `instagram_business_manage_messages` en Advanced Access
- Requisitos: screencast 30-60s demostrando uso del permiso + justificación escrita
- Tiempo estimado Meta: 3-7 días hábiles

## Decisiones abiertas

- [ ] Dominio: `pumai.cl` (nuevo) vs `pumai.cleverg.cl` (subdominio)
- [ ] Plataforma de deploy: Vercel vs Railway vs Fly.io vs VPS propio
- [ ] Orden de deploy: ¿solo páginas legales primero, o toda la app?

## Referencias

- Facebook Developer docs — Instagram Platform Webhooks: https://developers.facebook.com/docs/instagram-platform/webhooks/
- Facebook Developer docs — Messaging API with Instagram Login: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api/
- Thread comunidad n8n confirmando comportamiento Dev mode: https://community.n8n.io/t/instagram-dms-webhooks-work-only-in-test-mode/176851
- Dashboard app: https://developers.facebook.com/apps/2683021305424602/
- Graph API Explorer: https://developers.facebook.com/tools/explorer/

## Comandos útiles para retomar

```bash
# Variables base
export PAGE_TOKEN="EAAm..."
export PAGE_ID="592289943976769"
export IGBA_ID="17841473845424576"
export APP_ID="2683021305424602"

# Validar token (scopes, tipo, expiración)
curl -s "https://graph.facebook.com/debug_token?input_token=$PAGE_TOKEN&access_token=$PAGE_TOKEN" | python3 -m json.tool

# Confirmar link Page ↔ IG
curl -s "https://graph.facebook.com/v22.0/me?fields=id,name,instagram_business_account&access_token=$PAGE_TOKEN" | python3 -m json.tool

# Listar apps suscritas a la Page y los fields activos
curl -s "https://graph.facebook.com/v22.0/$PAGE_ID/subscribed_apps?access_token=$PAGE_TOKEN" | python3 -m json.tool

# Re-suscribir Page a webhook fields
curl -s -X POST "https://graph.facebook.com/v22.0/$PAGE_ID/subscribed_apps?subscribed_fields=messages,messaging_postbacks,message_reads,message_reactions,messaging_referrals&access_token=$PAGE_TOKEN"

# Ver requests que recibe ngrok
curl -s "http://127.0.0.1:4040/api/requests/http?limit=10" | python3 -m json.tool

# Logs app filtrando integración Meta
docker compose logs -f app | grep -iE 'meta|instagram|pipeline'

# Acceso a Postgres
docker compose exec postgres psql -U pumai -d pumai_db

# Inspeccionar ChannelConfig de Instagram
docker compose exec -T postgres psql -U pumai -d pumai_db -c "SELECT id, channel, \"externalId\", credentials, active FROM \"ChannelConfig\" WHERE channel='INSTAGRAM';"
```
