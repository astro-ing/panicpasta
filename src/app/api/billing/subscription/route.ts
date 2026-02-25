import { NextResponse } from "next/server"
import Stripe from "stripe"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2026-01-28.clover",
  })
}

function getSubscriptionPayload(subscription?: Stripe.Subscription | null) {
  if (!subscription) {
    return {
      hasActiveSubscription: false,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      subscriptionId: null,
    }
  }

  const currentPeriodEndUnix =
    subscription.cancel_at ||
    subscription.items.data.reduce(
      (latest, item) => Math.max(latest, item.current_period_end),
      0
    )

  return {
    hasActiveSubscription: true,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd:
      currentPeriodEndUnix > 0
        ? new Date(currentPeriodEndUnix * 1000).toISOString()
        : null,
    subscriptionId: subscription.id,
  }
}

async function getLatestActiveSubscription(customerId: string) {
  const subscriptions = await getStripe().subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 20,
  })

  const active = subscriptions.data
    .filter((subscription) => subscription.status !== "canceled" && subscription.status !== "incomplete_expired")
    .sort((a, b) => {
      const aPeriodEnd = a.cancel_at || a.items.data.reduce((latest, item) => Math.max(latest, item.current_period_end), 0)
      const bPeriodEnd = b.cancel_at || b.items.data.reduce((latest, item) => Math.max(latest, item.current_period_end), 0)
      return bPeriodEnd - aPeriodEnd
    })

  return active[0] || null
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  })

  if (!user?.stripeCustomerId) {
    return NextResponse.json(getSubscriptionPayload())
  }

  try {
    const subscription = await getLatestActiveSubscription(user.stripeCustomerId)
    return NextResponse.json(getSubscriptionPayload(subscription))
  } catch (error) {
    console.error("Failed to fetch Stripe subscription:", error)
    return NextResponse.json({ error: "Failed to load subscription details." }, { status: 500 })
  }
}
