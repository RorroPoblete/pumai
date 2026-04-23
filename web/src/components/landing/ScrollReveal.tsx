"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function ScrollReveal({
  children,
  className = "",
  threshold = 0.15,
}: {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
}) {
  const ref = useScrollReveal<HTMLDivElement>(threshold);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
