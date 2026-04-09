import Navbar from "@/frontend/components/landing/Navbar";
import Hero from "@/frontend/components/landing/Hero";
import Features from "@/frontend/components/landing/Features";
import HowItWorks from "@/frontend/components/landing/HowItWorks";
import Pricing from "@/frontend/components/landing/Pricing";
import Industries from "@/frontend/components/landing/Industries";
import LogoCarousel from "@/frontend/components/landing/LogoCarousel";
import CTA from "@/frontend/components/landing/CTA";
import Footer from "@/frontend/components/landing/Footer";
import ScrollReveal from "@/frontend/components/landing/ScrollReveal";

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
    </>
  );
}
