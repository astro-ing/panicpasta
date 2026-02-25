import { Button } from "@/components/ui/button";
import { DemoWidget } from "./demo-widget";
import Link from "next/link";

interface HeroProps {
  ctaHref: string;
  isLoggedIn: boolean;
}

export function Hero({ ctaHref, isLoggedIn }: HeroProps) {
  const primaryCtaLabel = isLoggedIn ? "Go to Dashboard" : "Get Started Free";

  return (
    <section className="relative overflow-hidden bg-pasta-50 pt-24 pb-32">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #1a1816 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      
      <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-charcoal-900 bg-white text-xs font-bold mb-8 shadow-[4px_4px_0px_0px_#1a1816] transform -rotate-2 hover:rotate-0 transition-transform cursor-default">
          <span className="w-2.5 h-2.5 rounded-full bg-basil-500 animate-pulse border border-charcoal-900" />
          One plan. Many preferences.
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-charcoal-900 mb-6 leading-[1.05]">
          <span className="block min-[500px]:whitespace-nowrap">
            Dinner for{" "}
            <span className="text-tomato-500 relative inline-block whitespace-nowrap">
              every
              <svg className="absolute -bottom-2 left-0 w-full h-4 text-charcoal-900" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0,10 Q25,20 50,10 T100,10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>{" "}
            diet,
          </span>
          <span className="block">
            in{" "}
            <span className="text-tomato-500 relative inline-block whitespace-nowrap">
              one
              <svg className="absolute -bottom-2 left-0 w-full h-4 text-charcoal-900" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0,10 Q25,20 50,10 T100,10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>{" "}
            plan.
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-charcoal-800 mb-12 max-w-2xl lg:max-w-3xl mx-auto font-medium leading-relaxed text-balance">
          The household-aware meal planner that automatically generates{" "}
          <span className="font-bold text-basil-600 bg-basil-400/20 px-2 py-0.5 mx-1.5 rounded-md border-2 border-basil-400/30 inline-block transform rotate-1">personal forks</span>
          <br className="hidden lg:block" />
          for allergies, diets, and picky eaters.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-24 items-center">
          <Button asChild size="lg" className="w-full sm:w-auto text-lg rotate-1">
            <Link href={ctaHref}>{primaryCtaLabel}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-lg -rotate-1 bg-white">
            <Link href="/#pricing">See Pricing</Link>
          </Button>
        </div>
        
        <div className="relative">
          <div className="absolute -inset-4 bg-tomato-400/20 rounded-[3rem] blur-2xl z-0"></div>
          <DemoWidget />
        </div>
      </div>
    </section>
  )
}
