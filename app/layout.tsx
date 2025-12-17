import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LegalExpat - Connect with Legal Experts in Germany",
  description: "A platform connecting expats in Germany with trusted legal service providers. Find lawyers, tax advisors, and legal consultants specialized in expat services.",
  keywords: ["legal services", "expats", "Germany", "lawyers", "immigration", "tax advisors"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
