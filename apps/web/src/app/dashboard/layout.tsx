import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const isPro = user.plan === "pro" && user.stripeSubscriptionStatus !== "cancelled";

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      <nav className="nav" aria-label="Main">
        <Link href="/dashboard" className="brand">Carbon Canvas</Link>
        <Link href="/dashboard">Overview</Link>
        <Link href="/dashboard/usage">Usage</Link>
        <Link href="/dashboard/impact">Impact</Link>
        <Link href="/dashboard/optimize">Optimize {isPro ? "· Pro" : "· Locked"}</Link>
        <Link href="/dashboard/methodology">Methodology</Link>
        <span className="spacer" />
        {!isPro && <Link href="/dashboard/optimize" style={{ color: "var(--accent)", fontWeight: 650 }}>Upgrade</Link>}
        <Link href="/dashboard/settings">Settings</Link>
        <LogoutButton />
      </nav>
      {children}
    </div>
  );
}
