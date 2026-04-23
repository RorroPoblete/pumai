import Script from "next/script";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";
import Industries from "@/components/landing/Industries";
import LogoCarousel from "@/components/landing/LogoCarousel";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import ScrollReveal from "@/components/landing/ScrollReveal";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <ScrollReveal>
        <LogoCarousel />
      </ScrollReveal>
      <ScrollReveal>
        <Features />
      </ScrollReveal>
      <ScrollReveal>
        <HowItWorks />
      </ScrollReveal>
      <ScrollReveal>
        <Pricing />
      </ScrollReveal>
      <ScrollReveal>
        <Industries />
      </ScrollReveal>
      <ScrollReveal>
        <CTA />
      </ScrollReveal>
      <Footer />
      <Script
        src="/widget.js"
        data-widget-key="wk_pumai_landing"
        strategy="afterInteractive"
      />
    </>
  );
}
