import AuthSessionProvider from "@/components/AuthSessionProvider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
