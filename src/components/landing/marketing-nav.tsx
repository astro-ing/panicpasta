import Link from "next/link";
import { Button } from "@/components/ui/button";

interface MarketingNavProps {
  isLoggedIn: boolean;
}

export function MarketingNav({ isLoggedIn }: MarketingNavProps) {

  return (
    <nav className="sticky top-0 z-50 border-b-4 border-charcoal-900 bg-pasta-50/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Link
          href="/"
          className="group inline-flex items-center gap-1 font-serif font-black text-2xl text-charcoal-900 justify-self-start"
        >
          <span className="tracking-tight">PANIC</span>
          <span className="text-tomato-500 -rotate-1 transition-transform group-hover:rotate-0">Pasta!</span>
        </Link>

        <div className="hidden md:flex items-center gap-2 justify-self-center">
          <Button asChild size="sm" variant="outline" className="bg-white -rotate-1">
            <Link href="/#features">Features</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="bg-white rotate-1">
            <Link href="/#pricing">Pricing</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 justify-self-end">
          {isLoggedIn ? (
            <Button asChild size="sm" className="text-base">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex bg-white">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="text-base">
                <Link href="/auth/signin">Get Started Free</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="md:hidden border-t-2 border-charcoal-900/10 bg-white/90">
        <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-8">
          <Link href="/#features" className="text-sm font-bold text-charcoal-800 hover:text-tomato-500 transition-colors">
            Features
          </Link>
          <Link href="/#pricing" className="text-sm font-bold text-charcoal-800 hover:text-tomato-500 transition-colors">
            Pricing
          </Link>
          {isLoggedIn ? (
            <Link href="/dashboard" className="text-sm font-bold text-charcoal-800 hover:text-tomato-500 transition-colors">
              Dashboard
            </Link>
          ) : (
            <Link href="/auth/signin" className="text-sm font-bold text-charcoal-800 hover:text-tomato-500 transition-colors">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
