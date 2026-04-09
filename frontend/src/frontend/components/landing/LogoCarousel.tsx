const integrations = [
  { name: "HubSpot", logo: "HubSpot" },
  { name: "Shopify", logo: "Shopify" },
  { name: "Xero", logo: "Xero" },
  { name: "Stripe", logo: "Stripe" },
  { name: "Calendly", logo: "Calendly" },
  { name: "Google Calendar", logo: "Google" },
  { name: "Zapier", logo: "Zapier" },
  { name: "Slack", logo: "Slack" },
];

function LogoItem({ name }: { name: string }) {
  return (
    <div className="flex-shrink-0 flex items-center justify-center px-8 py-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(139,92,246,0.3)] hover:bg-[rgba(139,92,246,0.05)] transition-all duration-300">
      <span className="text-sm font-semibold text-[#71717A] whitespace-nowrap tracking-wide">
        {name}
      </span>
    </div>
  );
}

export default function LogoCarousel() {
  return (
    <section className="py-16 overflow-hidden border-y border-[rgba(255,255,255,0.04)]">
      <div className="text-center mb-8">
        <span className="text-xs font-semibold text-[#71717A] tracking-widest uppercase">
          Integrates with your favourite tools
        </span>
      </div>

      {/* Infinite scroll track */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-black to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-black to-transparent pointer-events-none" />

        <div className="flex gap-6 animate-scroll w-max">
          {/* Duplicate for seamless loop */}
          {[...integrations, ...integrations].map((item, i) => (
            <LogoItem key={i} name={item.name} />
          ))}
        </div>
      </div>
    </section>
  );
}
