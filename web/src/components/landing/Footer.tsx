import Image from "next/image";
import Link from "next/link";

const footerLinks: Record<string, { label: string; href: string }[]> = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Integrations", href: "/#how-it-works" },
  ],
  Company: [
    { label: "About", href: "/#how-it-works" },
    { label: "Contact Sales", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Acceptable Use", href: "/acceptable-use" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
  Support: [
    { label: "Help Centre", href: "mailto:support@pumai.com.au" },
    { label: "Contact", href: "mailto:support@pumai.com.au" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="PumAI logo"
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span className="text-base font-bold text-[var(--text-primary)]">
                Pum<span className="text-[#8B5CF6]">AI</span>
              </span>
            </div>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              AI-powered omnichannel agents for Australian businesses. Built
              with compliance in mind.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                {heading}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => {
                  const external = link.href.startsWith("mailto:") || link.href.startsWith("http");
                  return (
                    <li key={link.label}>
                      {external ? (
                        <a
                          href={link.href}
                          className="text-sm text-[var(--text-muted)] hover:text-[#8B5CF6] transition-colors duration-200"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-[var(--text-muted)] hover:text-[#8B5CF6] transition-colors duration-200"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-muted)]">
            &copy; {new Date().getFullYear()} PumAI. All rights reserved.
            ABN registered in Australia.
          </p>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>Compliant with Spam Act 2003</span>
            <span>&middot;</span>
            <span>Privacy Act 1988</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
