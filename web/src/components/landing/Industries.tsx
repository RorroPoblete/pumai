import {
  HealthcareIcon,
  AutomotiveIcon,
  RealEstateIcon,
  EcommerceIcon,
  TradesIcon,
  HospitalityIcon,
} from "./IndustryIcons";

const industries = [
  {
    name: "Healthcare",
    description:
      "Appointment reminders, patient follow-ups, confirmations. Reduce no-shows below 5%.",
    icon: <HealthcareIcon />,
    priority: "high",
  },
  {
    name: "Automotive",
    description:
      "Lead follow-up, test drive scheduling, post-sale service reminders for dealer groups.",
    icon: <AutomotiveIcon />,
    priority: "high",
  },
  {
    name: "Real Estate",
    description:
      "Lead qualification, inspection bookings, and follow-up for 90K+ agents across Australia.",
    icon: <RealEstateIcon />,
    priority: "high",
  },
  {
    name: "E-commerce & Retail",
    description:
      "Shipping notifications, post-purchase support, product recommendations on WhatsApp and webchat. High conversion on both.",
    icon: <EcommerceIcon />,
    priority: "medium",
  },
  {
    name: "Trades & Services",
    description:
      "Quotes, job confirmations, payment collection for 750K+ tradies across Australia.",
    icon: <TradesIcon />,
    priority: "medium",
  },
  {
    name: "Hospitality",
    description:
      "Reservations, booking confirmations, last-minute offers to fill empty tables and rooms.",
    icon: <HospitalityIcon />,
    priority: "medium",
  },
];

export default function Industries() {
  return (
    <section
      id="industries"
      className="relative py-24 px-6"
      style={{
        background:
          "linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.03) 50%, transparent 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-[#8B5CF6] tracking-widest uppercase">
            Industries
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Built for{" "}
            <span className="gradient-text-violet">Australian industries</span>
          </h2>
          <p className="mt-4 text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            From healthcare to hospitality — our AI chatbots and agents adapt to every
            Australian vertical.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((ind, i) => (
            <div
              key={i}
              className={`card-gradient rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-1 ${
                ind.priority === "high"
                  ? "border-l-4 border-l-[#22c55e] border-t-[rgba(139,92,246,0.1)] border-r-[rgba(139,92,246,0.1)] border-b-[rgba(139,92,246,0.1)]"
                  : "border-l-4 border-l-[#3b82f6] border-t-[rgba(139,92,246,0.1)] border-r-[rgba(139,92,246,0.1)] border-b-[rgba(139,92,246,0.1)]"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12">{ind.icon}</div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                    ind.priority === "high"
                      ? "bg-[rgba(34,197,94,0.12)] text-[#22c55e]"
                      : "bg-[rgba(59,130,246,0.12)] text-[#3b82f6]"
                  }`}
                >
                  {ind.priority === "high" ? "High Priority" : "Growing"}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{ind.name}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {ind.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
