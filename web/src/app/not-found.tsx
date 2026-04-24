import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you're looking for doesn't exist or has been moved.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black gradient-text-violet mb-4">404</div>
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)] mb-3">Page not found</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="gradient-btn !text-white font-semibold px-6 py-3 rounded-xl glow-sm hover:glow-md transition-all"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-[#8B5CF6] hover:text-[#A78BFA] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
