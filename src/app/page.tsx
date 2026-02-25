import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Pricing } from "@/components/landing/pricing"
import { MarketingNav } from "@/components/landing/marketing-nav"
import { NewsletterSignupBox } from "@/components/landing/newsletter-signup-box"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function Home() {
  const session = await auth()
  const isLoggedIn = !!session?.user
  const ctaHref = isLoggedIn ? "/dashboard" : "/auth/signin"
  const membersMaxFree = Number(process.env.MEMBERS_MAX_FREE || 2)
  const membersMaxPro = Number(process.env.MEMBERS_MAX_PRO || 6)

  const account = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { newsletterSubscribed: true },
      })
    : null

  const isSubscribed = !!account?.newsletterSubscribed

  return (
    <main className="min-h-screen">
      <MarketingNav isLoggedIn={isLoggedIn} />
      <Hero ctaHref={ctaHref} isLoggedIn={isLoggedIn} />
      <Features />
      <Pricing
        ctaHref={ctaHref}
        isLoggedIn={isLoggedIn}
        membersMaxFree={membersMaxFree}
        membersMaxPro={membersMaxPro}
      />
      <footer className="bg-pasta-50 py-16 border-t-4 border-charcoal-900 text-charcoal-800">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] md:items-end">
            <div className="text-center md:text-left">
              <h2 className="font-serif font-black text-3xl mb-4 text-charcoal-900">PANIC Pasta</h2>
              <p className="font-medium">Stop making two dinners.</p>
            </div>

            <NewsletterSignupBox
              isLoggedIn={isLoggedIn}
              isSubscribed={isSubscribed}
            />
          </div>

          <div className="text-sm font-bold opacity-60 mt-8 text-center md:text-left">
            © 2026 PANIC Pasta · panicpasta.com
          </div>
        </div>
      </footer>
    </main>
  );
}
