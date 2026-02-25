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

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true, tier: true },
  })

  if (!user?.stripeCustomerId || user.tier !== "PRO") {
    return NextResponse.json({ error: "No active Pro subscription found." }, { status: 404 })
  }

  try {
    const subscription = await getLatestActiveSubscription(user.stripeCustomerId)
    if (!subscription) {
      return NextResponse.json({ error: "No active subscription found." }, { status: 404 })
    }

    if (subscription.cancel_at_period_end) {
      return NextResponse.json(getSubscriptionPayload(subscription))
    }

    const updated = await getStripe().subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    })

    return NextResponse.json(getSubscriptionPayload(updated))
  } catch (error) {
    console.error("Failed to cancel Stripe subscription:", error)
    return NextResponse.json({ error: "Failed to schedule cancellation." }, { status: 500 })
  }
}
