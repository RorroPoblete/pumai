import Image from "next/image";

const footerLinks = {
  Product: ["Features", "Pricing", "Integrations", "API Docs"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy Policy", "Terms of Service", "Spam Act Compliance"],
  Support: ["Help Centre", "Documentation", "Status", "Community"],
};

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="PumAI"
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span className="text-base font-bold text-white">
                Pum<span className="text-[#8B5CF6]">AI</span>
              </span>
            </div>
            <p className="text-sm text-[#71717A] leading-relaxed">
              AI-powered SMS agents for Australian businesses. Built with compliance
              in mind.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-sm font-semibold text-white mb-4">
                {heading}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-[#71717A] hover:text-[#A78BFA] transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#71717A]">
            &copy; {new Date().getFullYear()} PumAI. All rights reserved.
            ABN registered in Australia.
          </p>
          <div className="flex items-center gap-2 text-xs text-[#71717A]">
            <span>Compliant with Spam Act 2003</span>
            <span>&middot;</span>
            <span>Privacy Act 1988</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
