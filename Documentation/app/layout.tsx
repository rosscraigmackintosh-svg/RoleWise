import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rolewise Docs",
  description: "The Rolewise Product Manual — a complete reference for the product, its philosophy, rules, and design.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
