"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Particles from "./Particles";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctasRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!h1Ref.current) return;

      const fullText = h1Ref.current.textContent ?? "";
      h1Ref.current.setAttribute("aria-label", fullText);

      const split = new SplitText(h1Ref.current, {
        type: "lines,words,chars",
        linesClass: "split-line",
        wordsClass: "split-word",
        charsClass: "split-char",
        aria: "hidden",
      });

      gsap.set(split.chars, { yPercent: 110, opacity: 0 });
      gsap.set(
        [badgeRef.current, subtitleRef.current, ctasRef.current, statsRef.current],
        { opacity: 0, y: 24 }
      );

      const tl = gsap.timeline({ delay: 0.1 });

      tl.to(badgeRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "expo.out",
      })
        .to(
          split.chars,
          {
            yPercent: 0,
            opacity: 1,
            duration: 1.2,
            stagger: 0.02,
            ease: "expo.out",
            onComplete: () => {
              gsap.set(split.chars, { willChange: "auto" });
            },
          },
          "-=0.5"
        )
        .to(
          subtitleRef.current,
          { opacity: 1, y: 0, duration: 1, ease: "expo.out" },
          "-=0.6"
        )
        .to(
          ctasRef.current,
          { opacity: 1, y: 0, duration: 0.9, ease: "expo.out" },
          "-=0.7"
        )
        .to(
          statsRef.current,
          { opacity: 1, y: 0, duration: 0.9, ease: "expo.out" },
          "-=0.7"
        );

      gsap.to(contentRef.current, {
        scale: 1.1,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom 20%",
          scrub: 1,
        },
      });

      gsap.to(bgRef.current, {
        yPercent: -20,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });

      return () => {
        split.revert();
      };
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      data-bg-color="#000000"
      className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero"
    >
      <div ref={bgRef} className="absolute inset-0 will-change-transform">
        <Particles />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[rgba(139,92,246,0.08)] blur-[120px] pointer-events-none" />
      </div>

      <div
        ref={contentRef}
        className="relative z-10 text-center max-w-4xl mx-auto px-6 pt-32 pb-20 will-change-transform"
      >
        <div
          ref={badgeRef}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.08)] mb-8"
        >
          <span className="text-xs font-semibold text-[#8B5CF6] tracking-wide uppercase">
            Built for Australian Business
          </span>
        </div>

        <h1
          ref={h1Ref}
          className="hero-h1 text-5xl sm:text-6xl lg:text-7xl font-black tracking-[-0.04em] leading-[1.1] mb-6"
        >
          <span className="gradient-text">Your AI Sales &amp; </span>
          <span className="gradient-text">Support Team, </span>
          <span className="text-[#8B5CF6]">on Every Channel</span>
        </h1>

        <p
          ref={subtitleRef}
          className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          AI-powered agents that handle sales, support, and marketing 24/7 — via
          WhatsApp, Webchat, Instagram DMs, and Facebook Messenger. One platform,
          every conversation.
        </p>

        <div
          ref={ctasRef}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/register"
            className="gradient-btn !text-white font-semibold text-lg px-8 py-4 rounded-xl glow-sm hover:glow-md hover:-translate-y-0.5 transition-all duration-300"
          >
            Get Started
          </Link>
          <a
            href="#how-it-works"
            className="text-[var(--text-primary)] font-semibold text-lg px-8 py-4 rounded-xl border-2 border-[rgba(139,92,246,0.4)] hover:border-[#8B5CF6] hover:bg-[rgba(139,92,246,0.08)] transition-all duration-300"
          >
            See How It Works
          </a>
        </div>

        <div
          ref={statsRef}
          className="mt-16 grid grid-cols-3 gap-8 max-w-xl mx-auto"
        >
          {[
            { value: "24/7", label: "Always On" },
            { value: "2.5M+", label: "SMEs in Australia" },
            { value: "4", label: "Channels, One Platform" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl sm:text-3xl font-black gradient-text-violet">
                {s.value}
              </div>
              <div className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
