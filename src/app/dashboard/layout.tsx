import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Home, Users, CalendarDays, ShoppingBasket, Settings2 } from "lucide-react"
import { SignOutButton } from "@/components/dashboard/signout-button"
import { UpgradeProNavButton } from "@/components/dashboard/upgrade-pro-nav-button"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true },
  })
  const showUpgradeNavButton = user?.tier === "FREE"

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: Home },
    { href: "/dashboard/household", label: "Household", icon: Users },
    { href: "/dashboard/plans", label: "Meal Plans", icon: CalendarDays },
    { href: "/dashboard/pantry", label: "Pantry", icon: ShoppingBasket },
  ]

  return (
    <div className="min-h-screen bg-pasta-50">
      <nav className="bg-white border-b-4 border-charcoal-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link
            href="/"
            className="group inline-flex items-center gap-1 font-serif font-black text-2xl text-charcoal-900 transition-colors"
          >
            <span className="tracking-tight">PANIC</span>
            <span className="text-tomato-500 -rotate-1 transition-transform group-hover:rotate-0">Pasta!</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-charcoal-800 hover:bg-pasta-100 hover:text-tomato-500 transition-colors"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {showUpgradeNavButton && <UpgradeProNavButton />}
            <Link
              href="/dashboard/account"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-charcoal-800 hover:bg-pasta-100 hover:text-tomato-500 transition-colors"
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Account</span>
            </Link>
            <SignOutButton />
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex items-center justify-around border-t-2 border-charcoal-900/10 px-2 py-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-bold text-charcoal-800 hover:text-tomato-500 transition-colors"
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
