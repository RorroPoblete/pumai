# Compliance & Legal — PumAI

Plan de cumplimiento legal para operar PumAI en Australia. Cada ítem tiene estado actual y acción concreta para cerrarlo.

**Leyenda**: ✅ cumplido · 🟡 parcial · ⬜ pendiente · 🔴 crítico bloqueante

---

## 1. Documentos legales públicos

Requeridos antes de abrir registros públicos o cobrar.

| Documento | Ley / marco | Estado | Acción |
|-----------|-------------|--------|--------|
| Privacy Policy | Privacy Act 1988, APPs | ✅ | Publicada en `/privacy` — falta revisión legal |
| Terms of Service | ACL, Contract Law | ✅ | Publicada en `/terms` — falta revisión legal |
| Acceptable Use Policy | — | ✅ | Publicada en `/acceptable-use` |
| Refund / Cancellation Policy | ACL | ✅ | Incluida en sección 4 de T&C |
| Cookie Policy | Privacy Act | ✅ | Publicada en `/cookies` |
| Data Processing Agreement (DPA) | Privacy Act, contratos B2B | ⬜ | Plantilla firmable por clientes enterprise |
| AI Disclosure statement | Voluntary AI Safety Standard 2024 | 🟡 | Banner en widget + saludo automático agregados |

**Recomendación**: redactar con plantillas Termly / iubenda y hacer revisión legal AU (costo estimado A$1,500-3,000 one-time).

---

## 2. Privacy Act 1988 — Australian Privacy Principles (APP)

### APP 1 — Open management of personal information
- ⬜🔴 Publicar Privacy Policy accesible desde landing footer
- ⬜ Indicar contacto del Privacy Officer (email `privacy@pumai.com.au`)

### APP 3 — Collection of solicited personal information
- ✅ Solo se recolectan datos necesarios (nombre, email, business info)
- ✅ Los datos de contactos en conversaciones vienen de plataformas de terceros (Meta, WhatsApp)

### APP 5 — Notification of the collection of personal information
- ⬜ Disclaimer en formulario de registro con enlace a Privacy
- ⬜ Banner en widget webchat: "Los datos ingresados se guardan según nuestra Privacy Policy"
- ⬜ Primer mensaje automático en Messenger/IG/WA: aviso de recolección

### APP 6 — Use or disclosure of personal information
- ✅ Los datos se usan solo para el servicio contratado
- ⬜ Documentar en Privacy Policy las subcontrataciones:
  - OpenAI (EE.UU.) procesa conversaciones para generar respuestas
  - Stripe (EE.UU./Irlanda) procesa pagos
  - Meta (EE.UU.) procesa mensajes de sus plataformas

### APP 8 — Cross-border disclosure
- ⬜🔴 Disclaimer obligatorio: "Los datos pueden procesarse fuera de Australia (EE.UU., UE) por OpenAI y Stripe"
- ⬜ Incluir tabla de jurisdicciones en Privacy Policy

### APP 11 — Security of personal information
- 🟡 HTTPS solo cuando se despliegue a producción (hoy solo local HTTP)
- 🟡 Contraseñas con bcrypt
- ⬜ Encryption at rest en PostgreSQL
- ⬜ Credenciales de canales (WhatsApp token, Meta token) encriptados en DB (hoy JSON plano)
- ⬜ Backups automáticos con retención
- ⬜ Rotación de secretos documentada

### APP 12 — Access to personal information
- 🟡 Usuario puede ver sus conversaciones desde dashboard
- ⬜ Endpoint "Export my data" en Settings (JSON con todos los datos)

### APP 13 — Correction of personal information
- ✅ Settings permite editar información del business
- ⬜ Endpoint de eliminación total de cuenta (cascada)

---

## 3. Notifiable Data Breaches (NDB) scheme

Aplica si la empresa factura más de A$3M/año o maneja datos de salud.

- ⬜ Runbook de incident response (detección → contención → notificación)
- ⬜ Plantilla de notificación al OAIC
- ⬜ Plantilla de notificación a afectados
- ⬜ Plazo: notificar dentro de 30 días desde la detección
- ⬜ Contacto directo con OAIC: notifications@oaic.gov.au

---

## 4. AI Transparency — Voluntary AI Safety Standard (Australia 2024)

Estándar voluntario que probablemente se convertirá en obligatorio (alineado con EU AI Act). Implementarlo ahora reduce riesgo regulatorio futuro.

| Principio | Estado | Acción |
|-----------|--------|--------|
| 1. Accountability process | ⬜ | Designar responsable de AI governance |
| 2. Risk management | ⬜ | Documentar riesgos (alucinaciones, sesgo, privacidad) |
| 3. Data governance | 🟡 | Knowledge base permite control de inputs |
| 4. Testing & monitoring | ⬜ | Logs de conversaciones auditables |
| 5. Human oversight | ✅ | Human takeover (aiEnabled=false) |
| 6. Transparency with users | ⬜🔴 | Disclosure: "Estás hablando con un AI" |
| 7. Contestability | ⬜ | Botón "Hablar con un humano" en widget |
| 8. Accessibility | 🟡 | Widget cumple contraste WCAG parcialmente |
| 9. Records | 🟡 | Conversations se guardan completas |
| 10. Stakeholder engagement | ⬜ | Feedback channel desde el producto |

**Acción inmediata**:
- Widget webchat muestra texto discreto debajo del input: "Powered by AI — may make mistakes"
- Primer mensaje en Messenger/IG/WA incluye: "Hola, soy un asistente virtual con inteligencia artificial. Escribe 'humano' para hablar con alguien del equipo."

---

## 5. Australian Consumer Law (ACL)

### Consumer guarantees
- ⬜ Garantizar que el servicio funciona según lo prometido (uptime público)
- ⬜ SLA publicado para planes Enterprise

### Pricing transparency
- ⬜🔴 Precios en landing deben decir "**inc GST**" (A$249/mo inc GST)
- ⬜ Stripe checkout debe mostrar GST desglosado (Stripe Tax automático)
- ⬜ Factura fiscal con ABN del comprador (Stripe Tax lo recolecta)

### Cancellation & refunds
- ⬜ Política clara en T&C:
  - Cancelación en cualquier momento desde el portal
  - El cobro ya realizado cubre hasta fin del período
  - No se hacen reembolsos proporcionales (excepto falla del servicio)
- ⬜ Portal de Stripe permite cancelar sin fricción (ya configurable en Stripe Dashboard)

### Unsolicited communications — Spam Act 2003
- ⬜ Todo email outbound debe tener opción unsubscribe
- ⬜ WhatsApp / SMS: requerir opt-in explícito del usuario final

---

## 6. Meta Platform Policy (Facebook + Instagram)

Requerido para app review y operación en plataforma.

- ⬜🔴 Privacy Policy URL pública (requerido por Meta para app review)
- ⬜🔴 Terms of Service URL pública
- ⬜🔴 Data Deletion callback endpoint `/api/meta/deletion-callback` (obligatorio)
- ⬜ Respetar ventana de 24 horas en Messenger (solo template messages fuera de ventana)
- ⬜ No enviar mensajes no solicitados
- ⬜ Completar App Review con casos de uso documentados

---

## 7. WhatsApp Business Policy

Operando vía Whapi (no oficial BSP pero políticas aplican).

- ⬜ Opt-in explícito del usuario final antes de enviar mensajes
- ⬜ Respetar ventana de 24 horas
- ⬜ No marketing outbound sin opt-in documentado
- ⬜ Botón claro de opt-out en conversaciones

---

## 8. Seguridad técnica

### Cifrado
- 🟡 HTTPS en producción (pendiente deploy)
- ⬜ TLS 1.3 mínimo
- ⬜ HSTS header
- ⬜ Encryption at rest en PostgreSQL (Postgres TDE o filesystem encryption)
- ⬜ Encryption de secretos en DB (channel credentials, API tokens)

### Autenticación
- ✅ bcrypt para contraseñas (cost 12)
- ✅ JWT con HttpOnly cookies
- ⬜ Rate limiting en /api/auth/register y /api/auth/callback
- ⬜ 2FA opcional para usuarios
- ⬜ 2FA obligatorio para superadmin

### Autorización
- ✅ Multi-tenant con scoping por businessId en todas las queries
- ✅ Middleware + dashboard layout validan sesión y onboarded
- ⬜ Rate limiting global por IP/user

### Auditoría
- ✅ Timestamps Prisma en todos los modelos
- ✅ ProcessedWebhookEvent para trazabilidad de Stripe
- ⬜ Log estructurado (Pino o Winston) con retención de 12 meses
- ⬜ Log de accesos de superadmin a otros tenants
- ⬜ Log de cambios en subscriptions

### Backups & DR
- ⬜ Backups diarios automáticos de PostgreSQL
- ⬜ Retención 30 días mínimo
- ⬜ Prueba de restore mensual documentada
- ⬜ Disaster recovery plan

---

## 9. Stripe — requisitos legales

### Setup obligatorio antes de live
- ⬜ Stripe Tax activado (GST 10% automático)
- ⬜ Stripe Dashboard → Settings → Public details:
  - Legal business name + ABN
  - Support email `support@pumai.com.au`
  - Terms URL
  - Privacy URL
- ⬜ Customer portal configurado con cancel, invoice history, payment method update
- ⬜ Email receipts activados (default Stripe)
- ⬜ Smart Retries configurados (Settings → Billing → Subscriptions)
- ⬜ Dunning emails activados

### Facturación
- ✅ Tax ID collection en checkout (AU ABN)
- ⬜ Factura fiscal AU con datos del comprador
- ⬜ Link al portal desde cada email de Stripe

---

## 10. Registro de empresa

- ⬜ ABN registrado
- ⬜ GST registration (obligatorio si facturación anual > A$75,000)
- ⬜ Dominio corporativo pumai.com.au
- ⬜ Email corporativos (privacy@, support@, legal@, security@)
- ⬜ Registro ante OAIC (opcional pero recomendado)

---

## 11. Roadmap priorizado

### Fase A — Bloqueantes para apertura pública (1-2 semanas)

1. ✅ Páginas `/privacy`, `/terms`, `/acceptable-use`, `/cookies` publicadas con contenido AU-específico (texto base, falta revisión legal)
2. ✅ Checkbox de consentimiento en `/register` + guardado de `consentedAt` y `consentVersion` en DB
3. ✅ AI disclosure banner en widget webchat + saludo automático en primer contacto Messenger/IG/WA
4. ⬜🔴 Stripe Tax activo + URLs legales en Stripe Dashboard (acción del dueño)
5. ⬜🔴 Deploy en producción con HTTPS (Vercel o AWS + certmanager)
6. ✅ Endpoint `/api/meta/deletion-callback` con verificación HMAC + `/api/meta/deletion-status`
7. ✅ Precios con "inc GST" en landing + nota aclaratoria sobre bundle setup

### Fase B — Operar sin riesgos graves (primeros 50 clientes, ~1 mes)

8. ⬜ Right to be forgotten: botón "Eliminar cuenta" con cascada
9. ⬜ Export data: descargar todas las conversaciones en JSON
10. ⬜ Encryption de tokens de canales en DB
11. ⬜ Logging estructurado con retención 12 meses
12. ⬜ Backups automáticos diarios
13. ⬜ Rate limiting global por IP
14. ⬜ Runbook de incident response
15. ⬜ Revisión legal de documentos (abogado AU, A$1,500-3,000)

### Fase C — Enterprise readiness (6-12 meses)

16. ⬜ DPA template firmable
17. ⬜ SOC 2 Type 1 (costo A$20-40k, 6 meses)
18. ⬜ Penetration test anual (A$5-10k)
19. ⬜ 2FA obligatorio para superadmins
20. ⬜ SLA publicado con créditos por downtime
21. ⬜ ISO 27001 (opcional, si se apunta a gobierno)

---

## 12. Contactos y referencias

- **OAIC** (Office of the Australian Information Commissioner): https://www.oaic.gov.au
- **Voluntary AI Safety Standard**: https://www.industry.gov.au/publications/voluntary-ai-safety-standard
- **Privacy Act 1988**: https://www.legislation.gov.au/Details/C2022C00321
- **Australian Consumer Law**: https://consumer.gov.au
- **Spam Act 2003**: https://www.legislation.gov.au/Details/C2021C00461
- **Meta Platform Policy**: https://developers.facebook.com/policy
- **Stripe AU compliance**: https://stripe.com/docs/tax/australia

---

## Historial de actualizaciones

| Fecha | Cambio |
|-------|--------|
| 2026-04-20 | Documento inicial — auditoría de compliance con fases A/B/C |
| 2026-04-20 | Fase A: páginas legales, consent register, AI disclosure, Meta deletion callback, GST inc — completadas. Pendientes: Stripe Tax setup + deploy producción (externos). |
| 2026-04-22 | Cyber Neo audit: 22 findings resueltos en código (CN-001 a CN-020 + 2FA TOTP, audit log, pino logger, GitHub Actions CI, security.txt, file magic bytes). Risk score ~15/100. Pendientes: deploy HTTPS + backups + revisión legal profesional de T&C/Privacy. |
