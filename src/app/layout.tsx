import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: "PANIC Pasta | One plan that keeps everyone happy",
  description: "Household-aware meal planning with per-person forks. Stop making two dinners.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://panicpasta.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${dmSans.variable} ${fraunces.variable} font-sans bg-pasta-50 text-charcoal-900 antialiased selection:bg-tomato-500 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
