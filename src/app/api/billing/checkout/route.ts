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

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRO_PRICE_ID) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      tier: true,
      stripeCustomerId: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  if (user.tier === "PRO") {
    return NextResponse.json({ error: "You are already on Pro." }, { status: 400 })
  }

  if (!user.stripeCustomerId && !user.email) {
    return NextResponse.json({ error: "No account email available for checkout." }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"

  try {
    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard/account?billing=success`,
      cancel_url: `${baseUrl}/dashboard/account?billing=cancel`,
      metadata: {
        userId: user.id,
      },
      ...(user.stripeCustomerId
        ? { customer: user.stripeCustomerId }
        : { customer_email: user.email as string }),
    })

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 })
    }

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Stripe checkout creation failed:", error)
    return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 })
  }
}
