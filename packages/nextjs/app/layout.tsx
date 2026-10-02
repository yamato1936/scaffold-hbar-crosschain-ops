import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cross-Chain Ops | Scaffold-HBAR",
  description: "Tracking, replay, and reconciliation for Axelar-powered Hedera applications.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="siteHeader">
          <Link className="brand" href="/">
            Cross-Chain Ops
          </Link>
          <nav>
            <Link href="/operations">Operations</Link>
            <a href="https://github.com/yamato1936/scaffold-hbar-crosschain-ops">GitHub</a>
          </nav>
        </header>
        <main className="shell">{children}</main>
        <footer className="footer">
          Scaffold-HBAR starter · Hedera HCS + Mirror Node + Axelar GMP
        </footer>
      </body>
    </html>
  );
}
