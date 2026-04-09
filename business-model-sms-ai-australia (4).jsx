import { useState } from "react";

const sections = [
  {
    id: "overview",
    icon: "🇦🇺",
    title: "Visión General",
    content: {
      headline: "Agentes IA conversacionales por SMS y WhatsApp para empresas australianas",
      description:
        "Replicar el modelo de Vambe.ai — plataforma de agentes IA que automatizan ventas, soporte y marketing — adaptado al mercado australiano usando SMS (vía Cellcast, alcance 100%) y WhatsApp Business API (conversación rica, 33% AU) como canales principales, con GPT-4o Mini de OpenAI como motor de inteligencia.",
      points: [
        "Vambe opera sobre WhatsApp/Instagram en LATAM. En Australia, SMS tiene 94-98% open rate y alcance universal. WhatsApp tiene 33% penetración y crece.",
        "Dos canales, una plataforma: SMS vía Cellcast (2.8c/msg, carrier directo) + WhatsApp Business API (convs service gratis en ventana 24hr).",
        "GPT-4o Mini cuesta US$0.15/M tokens input y US$0.60/M output — el mismo motor de IA sirve ambos canales.",
        "Mercado: 2.5M+ de SMEs en Australia, 66% ya usan software SMS. Nadie ofrece IA conversacional dual-channel para SMEs.",
      ],
    },
  },
  {
    id: "value",
    icon: "💎",
    title: "Propuesta de Valor",
    content: {
      headline: "Tu equipo de ventas y soporte IA, 24/7, por SMS y WhatsApp",
      cards: [
        {
          title: "Para SMEs australianas",
          items: [
            "Agente IA que responde clientes 24/7 por SMS o WhatsApp",
            "SMS para alcance universal — WhatsApp para conversación rica",
            "Setup en minutos, sin código, integrado con CRM existente",
            "Reduce costos de personal hasta 60% en atención al cliente",
          ],
        },
        {
          title: "Diferenciadores vs competencia",
          items: [
            "Único dual-channel (SMS + WhatsApp) con IA conversacional para SMEs en AU",
            "IA conversacional real, no bots rígidos con menús",
            "WhatsApp: botones, imágenes, catálogos, links de pago",
            "SMS: alcance 100%, números virtuales australianos dedicados",
            "Integración nativa con HubSpot, Shopify, Xero (ecosistema AU)",
          ],
        },
      ],
    },
  },
  {
    id: "stack",
    icon: "⚙️",
    title: "Stack Tecnológico",
    content: {
      headline: "Arquitectura del sistema",
      layers: [
        {
          name: "Canal SMS",
          tech: "Cellcast API",
          detail: "REST API. Carrier directo: Telstra, Optus, Vodafone. 2.8c AUD/SMS a 100K+ vol. Números virtuales AU ($18/mes). Alcance 100% móviles.",
        },
        {
          name: "Canal WhatsApp",
          tech: "WhatsApp Business API",
          detail: "Vía 360dialog o Twilio. Conversaciones service (user-initiated) gratis 24hr. Rich media: imágenes, botones, links, catálogos. Marketing outbound ~US$0.04/msg.",
        },
        {
          name: "Motor de IA",
          tech: "OpenAI GPT-4o Mini",
          detail: "128K contexto. US$0.15/M input, US$0.60/M output. El modelo más costo-eficiente para chatbots de alto volumen. Soporte multilingüe.",
        },
        {
          name: "Orquestador",
          tech: "Backend Node.js / Python",
          detail: "Gestiona flujos conversacionales, contexto por cliente, routing IA/humano, integración CRM. Base de datos PostgreSQL + Redis para caché.",
        },
        {
          name: "Dashboard",
          tech: "React SPA",
          detail: "Panel de control para empresas: métricas, historial de conversaciones, configuración de agentes, analytics en tiempo real.",
        },
        {
          name: "Integraciones",
          tech: "APIs / Webhooks",
          detail: "HubSpot, Shopify, Xero, Stripe, Calendly, Google Calendar. Zapier para conexiones custom.",
        },
      ],
    },
  },
  {
    id: "revenue",
    icon: "💰",
    title: "Modelo de Ingresos",
    content: {
      headline: "Dos productos separados: SMS y WhatsApp — misma plataforma IA",
      smsPlans: [
        {
          name: "SMS Starter",
          price: "A$299/mes",
          features: ["300 conversaciones SMS/mes", "1 agente IA", "1 embudo", "Dashboard básico", "Soporte email", "Extra: A$0.60/conv"],
          target: "Negocios que necesitan alcance universal",
          setup: "A$500 implementación",
          channel: "SMS",
        },
        {
          name: "SMS Growth",
          price: "A$649/mes",
          features: ["1,000 conversaciones SMS/mes", "3 agentes IA", "3 embudos", "Integraciones CRM", "Analytics avanzado", "Soporte prioritario", "Extra: A$0.55/conv"],
          target: "SMEs en crecimiento",
          popular: true,
          setup: "A$900 implementación",
          channel: "SMS",
        },
        {
          name: "SMS Enterprise",
          price: "A$1,499+/mes",
          features: ["4,000 conversaciones/mes", "Agentes IA ilimitados", "Embudos ilimitados", "API dedicada", "SLA garantizado", "Account manager", "Extra: A$0.45/conv"],
          target: "Retail, healthcare, automotive",
          setup: "Custom",
          channel: "SMS",
        },
      ],
      waPlans: [
        {
          name: "WA Starter",
          price: "A$199/mes",
          features: ["500 conversaciones WA/mes", "1 agente IA", "1 embudo", "Rich media (imgs, botones, links)", "Dashboard básico", "Extra: A$0.25/conv"],
          target: "Negocios con audiencia joven/digital",
          setup: "A$500 implementación",
          channel: "WhatsApp",
        },
        {
          name: "WA Growth",
          price: "A$449/mes",
          features: ["2,000 conversaciones WA/mes", "3 agentes IA", "3 embudos", "Catálogos de productos", "Integraciones CRM", "Analytics avanzado", "Soporte prioritario", "Extra: A$0.20/conv"],
          target: "E-commerce, hospitality, services",
          popular: true,
          setup: "A$900 implementación",
          channel: "WhatsApp",
        },
        {
          name: "WA Enterprise",
          price: "A$999+/mes",
          features: ["Conversaciones ilimitadas", "Agentes IA ilimitados", "Embudos ilimitados", "API dedicada", "SLA garantizado", "Account manager", "Marketing outbound WA", "Extra: A$0.15/conv"],
          target: "Retail, e-commerce, multi-location",
          setup: "Custom",
          channel: "WhatsApp",
        },
      ],
      extras: [
        "Upgrade a Omnichannel (SMS+WA): +A$200/mes sobre cualquier plan — acceso a ambos canales",
        "Packs prepagados SMS: 500 convs por A$275",
        "Packs prepagados WA: 1,000 convs por A$180",
        "Número virtual SMS dedicado: A$15/mes",
        "WhatsApp Business API setup: incluido en implementación",
        "Implementación one-time: A$500-$900 (incluye setup + entrenamiento agente)",
      ],
    },
  },
  {
    id: "unit",
    icon: "📊",
    title: "Unit Economics",
    content: {
      headline: "Costo por conversación por canal y márgenes",
      metrics: [
        {
          label: "Costo conv SMS (6 msgs × 2.8c)",
          value: "~A$0.17",
          note: "Cellcast carrier directo AU",
        },
        {
          label: "Costo conv WhatsApp (user-initiated)",
          value: "~A$0.00",
          note: "Gratis en ventana 24hr de Meta + A$0.002 de IA",
        },
        {
          label: "Costo conv WhatsApp (marketing outbound)",
          value: "~A$0.06",
          note: "~US$0.04/msg Meta fee (Rest of APAC) + IA",
        },
        {
          label: "Margen SMS Growth (1,000 convs)",
          value: "71%",
          note: "A$649 − A$188 = A$461 margen",
        },
        {
          label: "Margen WA Growth (2,000 convs)",
          value: "95%",
          note: "A$449 − A$24 = A$425 margen (service convs gratis)",
        },
        {
          label: "Omnichannel upsell",
          value: "+A$200/mes",
          note: "Clientes que quieren ambos canales. ~95% margen en el delta",
        },
        {
          label: "Revenue de implementación",
          value: "A$500-900",
          note: "One-time, ~90% margen. Mismo setup ambos canales",
        },
        {
          label: "LTV/CAC target",
          value: ">5x",
          note: "LTV ~A$6,000 (12 meses blended) / CAC ~A$800",
        },
      ],
    },
  },
  {
    id: "segments",
    icon: "🎯",
    title: "Segmentos de Mercado",
    content: {
      headline: "Verticales prioritarias en Australia",
      segments: [
        {
          vertical: "Healthcare",
          use: "Recordatorios de citas, seguimiento de pacientes, confirmaciones",
          size: "Reduce cancelaciones <5%",
          priority: "Alta",
        },
        {
          vertical: "Automotive",
          use: "Seguimiento de leads, agendamiento de test drives, post-venta",
          size: "Multi-brand dealer groups",
          priority: "Alta",
        },
        {
          vertical: "Real Estate",
          use: "Calificación de leads, agendamiento de inspecciones, seguimiento",
          size: "90K+ agentes inmobiliarios en AU",
          priority: "Alta",
        },
        {
          vertical: "E-commerce / Retail",
          use: "Notificaciones de envío, soporte post-compra, recomendaciones",
          size: "Conversión SMS 21-50%",
          priority: "Media",
        },
        {
          vertical: "Trades & Services",
          use: "Cotizaciones, confirmación de trabajos, cobros",
          size: "750K+ tradies en AU",
          priority: "Media",
        },
        {
          vertical: "Hospitality",
          use: "Reservas, confirmaciones, ofertas de último minuto",
          size: "Sector en crecimiento",
          priority: "Media",
        },
      ],
    },
  },
  {
    id: "gtm",
    icon: "🚀",
    title: "Go-to-Market",
    content: {
      headline: "Estrategia de lanzamiento en 3 fases",
      phases: [
        {
          phase: "Fase 1 — MVP (Meses 1-3)",
          budget: "A$55K",
          actions: [
            "Construir plataforma core: Cellcast SMS + WhatsApp Business API (360dialog) + GPT-4o Mini + dashboard",
            "Lanzar planes SMS y WhatsApp por separado desde día 1",
            "10 beta customers: 5 en SMS (healthcare, automotive) + 5 en WhatsApp (e-commerce, hospitality)",
            "Validar qué canal tiene mejor engagement y retención en AU",
            "ABN registration, compliance Spam Act 2003, Privacy Act, SMS Sender ID Register (ACMA)",
          ],
        },
        {
          phase: "Fase 2 — Launch (Meses 4-8)",
          budget: "A$150K",
          actions: [
            "Lanzamiento público con 6 planes (3 SMS + 3 WhatsApp) + opción Omnichannel",
            "Integraciones con Xero, HubSpot, Shopify",
            "Registrarse como EMSP ante ACMA → wholesale SMS (~1.5c) con MTMO/Symbio",
            "Content marketing + Google Ads: posicionar como 'AI agent para SMEs AU'",
            "Partnerships con agencies digitales y consultoras CRM",
            "Target: 50 clientes pagando, A$25K MRR",
          ],
        },
        {
          phase: "Fase 3 — Scale (Meses 9-18)",
          budget: "A$500K (fundraise Seed)",
          actions: [
            "Expandir a Melbourne, Brisbane, Perth",
            "Push omnichannel como upgrade natural (+A$200/mes)",
            "Evaluar SMPP directo a Telstra/Optus para SMS <1.5c",
            "Agregar Instagram DMs como tercer canal (usa misma API de Meta)",
            "Feature: Agentic Ads (cross-sell entre clientes)",
            "Target: 300 clientes, A$150K MRR, preparar Series A",
          ],
        },
      ],
    },
  },
  {
    id: "compliance",
    icon: "🛡️",
    title: "Compliance & Legal",
    content: {
      headline: "Regulaciones clave en Australia",
      items: [
        {
          rule: "Spam Act 2003",
          detail: "Consentimiento previo obligatorio. Opt-out en cada mensaje. Identificación clara del remitente. Multas hasta A$2.2M.",
        },
        {
          rule: "Privacy Act 1988 (APPs)",
          detail: "Protección de datos personales. Notificación de breaches obligatoria. Transparencia en uso de IA.",
        },
        {
          rule: "SMS Sender ID Register",
          detail: "Registro obligatorio de Sender IDs antes del 1 julio 2026. Registrarse como EMSP ante ACMA para operar como 'originating telco' y gestionar Sender IDs de clientes.",
        },
        {
          rule: "Cellcast Compliance",
          detail: "ISO 27001 certificado. Adhiere a Industry Code C661:2022. Carrier directo AU (Telstra, Optus, Vodafone). Suspensión inmediata por SMS no solicitados.",
        },
        {
          rule: "AI Transparency",
          detail: "Disclosure obligatorio de que el cliente habla con IA. Australia aún no tiene ley específica de IA pero se prepara regulación.",
        },
      ],
    },
  },
  {
    id: "financials",
    icon: "📈",
    title: "Proyección Financiera",
    content: {
      headline: "Proyección a 18 meses",
      table: [
        { month: "Mes 3", clients: 10, mrr: "A$0", arr: "A$0", note: "Beta gratuita + A$5K implementaciones" },
        { month: "Mes 6", clients: 30, mrr: "A$16K", arr: "A$192K", note: "Primeros pagos + overages" },
        { month: "Mes 9", clients: 80, mrr: "A$44K", arr: "A$528K", note: "Product-market fit" },
        { month: "Mes 12", clients: 150, mrr: "A$82K", arr: "A$990K", note: "Expansión multi-city" },
        { month: "Mes 18", clients: 350, mrr: "A$192K", arr: "A$2.3M", note: "Pre-Series A" },
      ],
      assumptions: [
        "ARPU promedio: A$500/mes (mix SMS + WA plans + overages + omnichannel upsells)",
        "Mix esperado: 40% SMS plans, 45% WA plans, 15% Omnichannel",
        "Churn mensual: 5% (target <3% al mes 12). WA plans tienden a menor churn (más engagement)",
        "SMS cost: 2.8c (Cellcast) → 1.5c (wholesale). WA service: gratis. WA marketing: ~US$0.04/msg",
        "Margen bruto blended: ~80% (WA plans 95% margen + SMS plans 71%)",
        "Equipo: 2 founders + 3 engineers + 1 sales (mes 12)",
      ],
    },
  },
];

const nav = sections.map((s) => ({ id: s.id, icon: s.icon, title: s.title }));

export default function BusinessModel() {
  const [active, setActive] = useState("overview");
  const sec = sections.find((s) => s.id === active);

  return (
    <div
      style={{
        fontFamily: "'Instrument Sans', 'DM Sans', system-ui, sans-serif",
        background: "linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0f172a 100%)",
        color: "#e2e8f0",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "28px 24px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#f59e0b", textTransform: "uppercase", marginBottom: 6 }}>
          Business Model Canvas
        </div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            margin: 0,
            background: "linear-gradient(90deg, #f59e0b, #ef4444, #f59e0b)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          SMS & WhatsApp AI Agents — Australia
        </h1>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: "6px 0 0" }}>
          Vambe.ai model × Cellcast SMS × WhatsApp Business API × GPT-4o Mini
        </p>
      </div>

      {/* Nav */}
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          gap: 4,
          padding: "10px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          background: "rgba(0,0,0,0.15)",
        }}
      >
        {nav.map((n) => (
          <button
            key={n.id}
            onClick={() => setActive(n.id)}
            style={{
              flex: "0 0 auto",
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: active === n.id ? 700 : 500,
              background: active === n.id ? "rgba(245,158,11,0.15)" : "transparent",
              color: active === n.id ? "#f59e0b" : "#64748b",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {n.icon} {n.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "20px 16px", overflowY: "auto" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f8fafc", marginBottom: 4 }}>
          {sec.icon} {sec.title}
        </h2>
        <p style={{ fontSize: 14, color: "#f59e0b", fontWeight: 600, marginBottom: 16 }}>
          {sec.content.headline}
        </p>

        {/* Overview */}
        {sec.id === "overview" && (
          <div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "#cbd5e1", marginBottom: 16 }}>
              {sec.content.description}
            </p>
            {sec.content.points.map((p, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 8,
                  marginBottom: 8,
                  borderLeft: "3px solid #f59e0b",
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "#cbd5e1",
                }}
              >
                {p}
              </div>
            ))}
          </div>
        )}

        {/* Value Prop */}
        {sec.id === "value" &&
          sec.content.cards.map((c, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 10,
                padding: 16,
                marginBottom: 12,
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc", marginBottom: 10 }}>{c.title}</h3>
              {c.items.map((item, j) => (
                <div key={j} style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, paddingLeft: 12, borderLeft: "2px solid #334155" }}>
                  {item}
                </div>
              ))}
            </div>
          ))}

        {/* Stack */}
        {sec.id === "stack" &&
          sec.content.layers.map((l, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 10,
                padding: 14,
                marginBottom: 10,
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>{l.name}</span>
                <span
                  style={{
                    fontSize: 11,
                    background: "rgba(245,158,11,0.15)",
                    color: "#f59e0b",
                    padding: "3px 8px",
                    borderRadius: 4,
                    fontWeight: 600,
                  }}
                >
                  {l.tech}
                </span>
              </div>
              <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>{l.detail}</p>
            </div>
          ))}

        {/* Revenue */}
        {sec.id === "revenue" && (
          <div>
            {/* SMS Plans */}
            <div style={{ fontSize: 13, fontWeight: 700, color: "#22c55e", marginBottom: 8, letterSpacing: 1 }}>
              📱 PLANES SMS — Alcance universal (100% móviles)
            </div>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", marginBottom: 20 }}>
              {sec.content.smsPlans.map((p, i) => (
                <div
                  key={i}
                  style={{
                    flex: "1 0 180px",
                    background: p.popular ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                    border: p.popular ? "2px solid #22c55e" : "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                    padding: 16,
                    position: "relative",
                  }}
                >
                  {p.popular && (
                    <div style={{ position: "absolute", top: -10, right: 12, background: "#22c55e", color: "#000", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                      POPULAR
                    </div>
                  )}
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>{p.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#22c55e", margin: "6px 0" }}>{p.price}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>{p.target}</div>
                  {p.setup && <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 8, fontWeight: 600 }}>⚡ {p.setup}</div>}
                  {p.features.map((f, j) => (
                    <div key={j} style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>✓ {f}</div>
                  ))}
                </div>
              ))}
            </div>

            {/* WhatsApp Plans */}
            <div style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6", marginBottom: 8, letterSpacing: 1 }}>
              💬 PLANES WHATSAPP — Conversación rica (33% AU, creciendo)
            </div>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", marginBottom: 16 }}>
              {sec.content.waPlans.map((p, i) => (
                <div
                  key={i}
                  style={{
                    flex: "1 0 180px",
                    background: p.popular ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.03)",
                    border: p.popular ? "2px solid #3b82f6" : "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                    padding: 16,
                    position: "relative",
                  }}
                >
                  {p.popular && (
                    <div style={{ position: "absolute", top: -10, right: 12, background: "#3b82f6", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                      POPULAR
                    </div>
                  )}
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>{p.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#3b82f6", margin: "6px 0" }}>{p.price}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>{p.target}</div>
                  {p.setup && <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 8, fontWeight: 600 }}>⚡ {p.setup}</div>}
                  {p.features.map((f, j) => (
                    <div key={j} style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>✓ {f}</div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, color: "#64748b" }}>
              <strong style={{ color: "#94a3b8" }}>Extras y Omnichannel:</strong>
              {sec.content.extras.map((e, i) => (
                <div key={i} style={{ marginTop: 4 }}>• {e}</div>
              ))}
            </div>
          </div>
        )}

        {/* Unit Economics */}
        {sec.id === "unit" &&
          sec.content.metrics.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 8,
                marginBottom: 6,
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{m.label}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{m.note}</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f59e0b", whiteSpace: "nowrap", marginLeft: 12 }}>{m.value}</div>
            </div>
          ))}

        {/* Segments */}
        {sec.id === "segments" &&
          sec.content.segments.map((s, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 10,
                padding: 14,
                marginBottom: 8,
                borderLeft: `3px solid ${s.priority === "Alta" ? "#22c55e" : "#3b82f6"}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>{s.vertical}</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: s.priority === "Alta" ? "rgba(34,197,94,0.15)" : "rgba(59,130,246,0.15)",
                    color: s.priority === "Alta" ? "#22c55e" : "#3b82f6",
                    fontWeight: 600,
                  }}
                >
                  {s.priority}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{s.use}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{s.size}</div>
            </div>
          ))}

        {/* GTM */}
        {sec.id === "gtm" &&
          sec.content.phases.map((p, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 10,
                padding: 16,
                marginBottom: 12,
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>{p.phase}</span>
                <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>{p.budget}</span>
              </div>
              {p.actions.map((a, j) => (
                <div key={j} style={{ fontSize: 12, color: "#94a3b8", marginBottom: 5, paddingLeft: 10, borderLeft: "2px solid #334155" }}>
                  {a}
                </div>
              ))}
            </div>
          ))}

        {/* Compliance */}
        {sec.id === "compliance" &&
          sec.content.items.map((item, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 10,
                padding: 14,
                marginBottom: 8,
                borderLeft: "3px solid #ef4444",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc", marginBottom: 4 }}>{item.rule}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{item.detail}</div>
            </div>
          ))}

        {/* Financials */}
        {sec.id === "financials" && (
          <div>
            <div style={{ overflowX: "auto", marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(255,255,255,0.1)" }}>
                    {["Periodo", "Clientes", "MRR", "ARR", "Nota"].map((h) => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sec.content.table.map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "8px 10px", fontWeight: 600, color: "#e2e8f0" }}>{r.month}</td>
                      <td style={{ padding: "8px 10px", color: "#f59e0b", fontWeight: 700 }}>{r.clients}</td>
                      <td style={{ padding: "8px 10px", color: "#22c55e" }}>{r.mrr}</td>
                      <td style={{ padding: "8px 10px", color: "#22c55e" }}>{r.arr}</td>
                      <td style={{ padding: "8px 10px", color: "#94a3b8" }}>{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              <strong style={{ color: "#94a3b8" }}>Supuestos:</strong>
              {sec.content.assumptions.map((a, i) => (
                <div key={i} style={{ marginTop: 4 }}>
                  • {a}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
