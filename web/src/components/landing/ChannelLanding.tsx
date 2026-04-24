import Link from "next/link";
import Navbar from "./Navbar";
import Footer from "./Footer";
import JsonLd from "@/components/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pumai.com.au";

export type ChannelLandingProps = {
  slug: string;
  h1: string;
  eyebrow: string;
  heroSubtitle: string;
  productName: string;
  productDescription: string;
  keywordIntro: string;
  benefits: { title: string; description: string }[];
  howItWorks: { step: string; title: string; description: string }[];
  useCases: { title: string; description: string }[];
  faqs: { q: string; a: string }[];
  priceFrom: string;
};

export default function ChannelLanding({
  slug,
  h1,
  eyebrow,
  heroSubtitle,
  productName,
  productDescription,
  keywordIntro,
  benefits,
  howItWorks,
  useCases,
  faqs,
  priceFrom,
}: ChannelLandingProps) {
  const url = `${SITE_URL}/${slug}`;

  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    description: productDescription,
    brand: { "@type": "Brand", name: "PumAI" },
    url,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "AUD",
      lowPrice: priceFrom,
      availability: "https://schema.org/OnlineOnly",
      url: `${SITE_URL}/pricing`,
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: h1, item: url },
    ],
  };

  return (
    <>
      <JsonLd data={[product, faqSchema, breadcrumbs]} />
      <Navbar />
      <main className="pt-24">
        {/* Hero */}
        <section className="relative px-6 pt-16 pb-20 max-w-4xl mx-auto text-center overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[rgba(139,92,246,0.1)] blur-[120px] pointer-events-none" />
          <div className="relative">
            <span className="inline-block text-xs font-semibold text-[#8B5CF6] tracking-widest uppercase mb-4">
              {eyebrow}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[var(--text-primary)] leading-[1.1]">
              {h1}
            </h1>
            <p className="mt-6 text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              {heroSubtitle}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="gradient-btn !text-white font-semibold text-lg px-8 py-4 rounded-xl glow-sm hover:glow-md transition-all"
              >
                Start free trial
              </Link>
              <Link
                href="/pricing"
                className="text-[var(--text-primary)] font-semibold text-lg px-8 py-4 rounded-xl border-2 border-[rgba(139,92,246,0.4)] hover:border-[#8B5CF6] hover:bg-[rgba(139,92,246,0.08)] transition-all"
              >
                See pricing from A${priceFrom}
              </Link>
            </div>
          </div>
        </section>

        {/* Intro copy */}
        <section className="px-6 pb-16 max-w-3xl mx-auto">
          <p className="text-base text-[var(--text-secondary)] leading-relaxed">{keywordIntro}</p>
        </section>

        {/* Benefits */}
        <section className="px-6 py-16 max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] text-center mb-12">
            Why Australian teams choose PumAI for {eyebrow}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="card-gradient border border-[rgba(139,92,246,0.15)] rounded-2xl p-6 hover:border-[rgba(139,92,246,0.4)] transition-colors"
              >
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{b.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 py-16 max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] text-center mb-12">
            How {productName} works
          </h2>
          <ol className="space-y-6">
            {howItWorks.map((s) => (
              <li key={s.step} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.3)] flex items-center justify-center text-[#8B5CF6] font-bold">
                  {s.step}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{s.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">{s.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Use cases */}
        <section className="px-6 py-16 max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] text-center mb-12">
            Popular {eyebrow} use cases
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCases.map((u) => (
              <div
                key={u.title}
                className="card-gradient border border-[rgba(139,92,246,0.15)] rounded-2xl p-6"
              >
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{u.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{u.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 py-16 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] text-center mb-12">
            {eyebrow} AI — frequently asked questions
          </h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group card-gradient border border-[rgba(139,92,246,0.15)] rounded-xl p-5 hover:border-[rgba(139,92,246,0.4)] transition-colors"
              >
                <summary className="cursor-pointer font-semibold text-[var(--text-primary)] flex items-center justify-between">
                  {f.q}
                  <span className="text-[#8B5CF6] ml-4 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto text-center card-gradient border border-[rgba(139,92,246,0.25)] rounded-3xl p-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
              Ready to automate your {eyebrow.toLowerCase()}?
            </h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">
              Start free, no credit card required. Go live in under an hour.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="gradient-btn !text-white font-semibold text-lg px-8 py-4 rounded-xl glow-sm hover:glow-md transition-all"
              >
                Start free trial
              </Link>
              <Link
                href="/contact"
                className="text-[var(--text-primary)] font-semibold text-lg px-8 py-4 rounded-xl border-2 border-[rgba(139,92,246,0.4)] hover:border-[#8B5CF6] hover:bg-[rgba(139,92,246,0.08)] transition-all"
              >
                Talk to sales
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
