"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  {
    label: "Overview",
    href: "/admin",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Businesses",
    href: "/admin/businesses",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside className="hidden lg:flex w-60 flex-col border-r border-[rgba(255,255,255,0.06)] bg-[#0a0a0a] fixed inset-y-0 left-0 z-40">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="px-5 py-6 flex items-center gap-2.5">
          <Image src="/logo.png" alt="PumAI" width={30} height={30} className="rounded-lg" />
          <span className="text-base font-bold text-white">
            Pum<span className="text-[#8B5CF6]">AI</span>
          </span>
          <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[rgba(239,68,68,0.12)] text-[#ef4444]">
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-[rgba(239,68,68,0.1)] text-white"
                  : "text-[#71717A] hover:text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.04)]"
              }`}
            >
              <span className={isActive(item.href) ? "text-[#ef4444]" : ""}>{item.icon}</span>
              {item.label}
            </Link>
          ))}

          {/* Link to regular dashboard */}
          <div className="pt-4 mt-4 border-t border-[rgba(255,255,255,0.06)]">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#71717A] hover:text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.04)] transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              Go to Dashboard
            </Link>
          </div>
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[#71717A] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.06)] transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}
