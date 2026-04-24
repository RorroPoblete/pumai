"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
}

type RevealOpts = {
  start?: string;
  end?: string;
  stagger?: number;
  duration?: number;
  delay?: number;
  once?: boolean;
};

export function splitTextReveal(
  target: string | Element,
  opts: RevealOpts = {}
): SplitText | null {
  const els = typeof target === "string" ? gsap.utils.toArray<Element>(target) : [target];
  if (!els.length) return null;

  const el = els[0] as HTMLElement;

  if (!el.getAttribute("aria-label") && el.textContent) {
    el.setAttribute("aria-label", el.textContent);
  }

  const split = new SplitText(el, { type: "chars,words", charsClass: "split-char", wordsClass: "split-word", aria: "hidden" });

  gsap.set(split.chars, {
    yPercent: 110,
    opacity: 0,
    display: "inline-block",
  });

  gsap.to(split.chars, {
    yPercent: 0,
    opacity: 1,
    duration: opts.duration ?? 1.2,
    stagger: opts.stagger ?? 0.02,
    delay: opts.delay ?? 0,
    ease: "expo.out",
    scrollTrigger: {
      trigger: el,
      start: opts.start ?? "top 85%",
      end: opts.end,
      once: opts.once ?? true,
      toggleActions: opts.once === false ? "play reverse play reverse" : "play none none none",
    },
  });

  return split;
}

export function parallaxImage(
  target: string | Element,
  strength = 20
): gsap.core.Tween | null {
  const els = typeof target === "string" ? gsap.utils.toArray<Element>(target) : [target];
  if (!els.length) return null;

  return gsap.to(els, {
    yPercent: -strength,
    ease: "none",
    scrollTrigger: {
      trigger: els[0] as Element,
      start: "top bottom",
      end: "bottom top",
      scrub: 1,
    },
  });
}

export function pinAndScrub(
  trigger: Element,
  animation: gsap.core.Timeline | gsap.core.Tween,
  opts: { end?: string; anticipatePin?: number } = {}
): ScrollTrigger {
  return ScrollTrigger.create({
    trigger,
    pin: true,
    start: "top top",
    end: opts.end ?? "+=150%",
    scrub: 1,
    anticipatePin: opts.anticipatePin ?? 1,
    animation,
  });
}

export function curtainReveal(
  target: string | Element,
  opts: RevealOpts = {}
): gsap.core.Tween | null {
  const els = typeof target === "string" ? gsap.utils.toArray<Element>(target) : [target];
  if (!els.length) return null;

  gsap.set(els, { clipPath: "inset(100% 0 0 0)", yPercent: 8, willChange: "clip-path, transform" });

  return gsap.to(els, {
    clipPath: "inset(0% 0 0 0)",
    yPercent: 0,
    duration: opts.duration ?? 1.1,
    stagger: opts.stagger ?? 0.08,
    ease: "expo.out",
    scrollTrigger: {
      trigger: els[0] as Element,
      start: opts.start ?? "top 80%",
      once: opts.once ?? true,
    },
    onComplete: () => {
      gsap.set(els, { willChange: "auto" });
    },
  });
}

export function useCinematicReveal() {
  return { splitTextReveal, parallaxImage, pinAndScrub, curtainReveal };
}
