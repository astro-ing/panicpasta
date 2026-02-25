"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";

interface PricingProps {
  ctaHref: string;
  isLoggedIn: boolean;
  membersMaxFree: number;
  membersMaxPro: number;
}

function getCurrencySymbol(timezone: string) {
  if (
    timezone === "Europe/London" ||
    timezone === "Europe/Jersey" ||
    timezone === "Europe/Guernsey" ||
    timezone === "Europe/Isle_of_Man"
  ) {
    return "£";
  }

  if (timezone.startsWith("Europe/")) {
    return "€";
  }

  if (timezone.startsWith("America/")) {
    return "$";
  }

  return "$";
}

export function Pricing({ ctaHref, isLoggedIn, membersMaxFree, membersMaxPro }: PricingProps) {
  const currencySymbol = useMemo(() => {
    if (typeof window === "undefined") {
      return "$";
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return getCurrencySymbol(timezone);
  }, []);

  const freePrice = `${currencySymbol}0`;
  const proPrice = `${currencySymbol}5`;

  const freeCtaLabel = isLoggedIn ? "Go to Dashboard" : "Get Started Free";
  const proCtaLabel = isLoggedIn ? "Manage in Account" : "Start With Free, Upgrade Later";
  const proCtaHref = isLoggedIn ? "/dashboard/account" : ctaHref;

  return (
    <section id="pricing" className="py-28 bg-pasta-50 border-b-4 border-charcoal-900 scroll-mt-28">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tight text-charcoal-900">Simple Pricing</h2>
          <p className="text-xl text-charcoal-800 font-medium">Start free, upgrade when your household grows.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <article className="bg-white border-4 border-charcoal-900 rounded-[2rem] p-8 shadow-[8px_8px_0px_0px_#1a1816]">
            <p className="text-sm font-black uppercase tracking-wide text-charcoal-800 mb-2">Free</p>
            <div className="mb-4 flex items-end gap-2">
              <p suppressHydrationWarning className="text-5xl font-black text-charcoal-900">{freePrice}</p>
              <p className="text-sm font-bold text-charcoal-800 pb-1">/month</p>
            </div>
            <ul className="space-y-2 text-charcoal-800 font-medium mb-8">
              <li>Up to {membersMaxFree} household members</li>
              <li>1 plan generation per day</li>
              <li>Up to 3-day meal plans</li>
            </ul>
            <Button asChild size="lg" className="w-full text-lg">
              <Link href={ctaHref}>{freeCtaLabel}</Link>
            </Button>
          </article>

          <article className="bg-pasta-100 border-4 border-charcoal-900 rounded-[2rem] p-8 shadow-[8px_8px_0px_0px_#1a1816] md:-rotate-1">
            <p className="text-sm font-black uppercase tracking-wide text-charcoal-800 mb-2">Pro</p>
            <div className="mb-4 flex items-end gap-2">
              <p suppressHydrationWarning className="text-5xl font-black text-charcoal-900">{proPrice}</p>
              <p className="text-sm font-bold text-charcoal-800 pb-1">/month</p>
            </div>
            <ul className="space-y-2 text-charcoal-800 font-medium mb-8">
              <li>Up to {membersMaxPro} household members</li>
              <li>3 plan generations per day</li>
              <li>Up to 30-day meal plans + pantry mode</li>
            </ul>
            <Button asChild size="lg" variant="secondary" className="w-full text-lg">
              <Link href={proCtaHref}>{proCtaLabel}</Link>
            </Button>
          </article>
        </div>
      </div>
    </section>
  );
}
