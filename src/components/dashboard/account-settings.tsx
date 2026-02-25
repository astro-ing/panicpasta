"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Loader2, Mail, Ruler, Sparkles, CreditCard } from "lucide-react"
import { guessMeasurementSystem, type MeasurementSystem } from "@/lib/measurement"

interface AccountResponse {
  email: string | null
  tier: "FREE" | "PRO"
  stripeCustomerId: string | null
  generationsToday: number
  generationsResetAt: string
  measurementSystem: MeasurementSystem
  newsletterSubscribed: boolean
  createdAt: string
  limits: {
    dailyGenerations: number
    maxPlanDays: number
    maxMembers: number
  }
}

interface SubscriptionResponse {
  hasActiveSubscription: boolean
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
  subscriptionId: string | null
}

function redactEmail(email: string | null): string {
  if (!email) return "No email on file"
  const [localPart, domain] = email.split("@")
  if (!domain || !localPart) return "Hidden"

  const prefix = localPart.slice(0, 2)
  const suffix = localPart.length > 3 ? localPart.slice(-1) : ""
  const hiddenLength = Math.max(localPart.length - prefix.length - suffix.length, 3)

  return `${prefix}${"*".repeat(hiddenLength)}${suffix}@${domain}`
}

function formatBillingDate(value: string | null) {
  if (!value) return null

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function AccountSettings() {
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, [])
  const [account, setAccount] = useState<AccountResponse | null>(null)
  const [measurementSystem, setMeasurementSystem] = useState<MeasurementSystem>("metric")
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newsletterSaving, setNewsletterSaving] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionResponse | null>(null)
  const [error, setError] = useState("")
  const [saveMessage, setSaveMessage] = useState("")
  const [newsletterMessage, setNewsletterMessage] = useState("")
  const [billingMessage, setBillingMessage] = useState("")
  const accountTier = account?.tier
  const stripeCustomerId = account?.stripeCustomerId

  const loadAccount = useCallback(async () => {
    setError("")
    setLoading(true)

    try {
      const res = await fetch(`/api/account?timezone=${encodeURIComponent(timezone)}`, { cache: "no-store" })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to load account settings.")
        return
      }

      setAccount(data)
      setMeasurementSystem(data.measurementSystem || guessMeasurementSystem(timezone))
      setNewsletterSubscribed(!!data.newsletterSubscribed)
    } catch {
      setError("Something went wrong while loading your account.")
    } finally {
      setLoading(false)
    }
  }, [timezone])

  const loadSubscriptionInfo = useCallback(async () => {
    setSubscriptionLoading(true)

    try {
      const res = await fetch("/api/billing/subscription", { cache: "no-store" })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to load subscription details.")
        return
      }

      setSubscriptionInfo(data)
    } catch {
      setError("Something went wrong while loading subscription details.")
    } finally {
      setSubscriptionLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAccount()
  }, [loadAccount])

  useEffect(() => {
    if (accountTier !== "PRO" || !stripeCustomerId) {
      setSubscriptionInfo(null)
      return
    }

    void loadSubscriptionInfo()
  }, [accountTier, stripeCustomerId, loadSubscriptionInfo])

  const hasUnitChanges = !!account && measurementSystem !== account.measurementSystem
  const isSaveDisabled = !hasUnitChanges || saving
  const usagePercent = account
    ? Math.min((account.generationsToday / account.limits.dailyGenerations) * 100, 100)
    : 0
  const billingPeriodLabel = formatBillingDate(subscriptionInfo?.currentPeriodEnd ?? null)
  const billingStatusLabel = subscriptionLoading
    ? "Loading Stripe details..."
    : account?.tier === "PRO" && subscriptionInfo?.hasActiveSubscription
      ? subscriptionInfo.cancelAtPeriodEnd
        ? `Cancels on ${billingPeriodLabel || "period end"}`
        : `Renews on ${billingPeriodLabel || "next billing period"}`
      : account?.stripeCustomerId
        ? "Stripe connected"
        : "No active Stripe subscription"

  const handleSaveUnits = async () => {
    if (!account || !hasUnitChanges) return

    setSaving(true)
    setSaveMessage("")
    setNewsletterMessage("")
    setError("")

    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ measurementSystem }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to save measurement preference.")
        return
      }

      setAccount((prev) =>
        prev
          ? {
              ...prev,
              measurementSystem: data.measurementSystem,
              newsletterSubscribed: data.newsletterSubscribed,
            }
          : prev
      )
      setNewsletterSubscribed(!!data.newsletterSubscribed)
      setSaveMessage("Measurement preference saved.")
    } catch {
      setError("Something went wrong while saving.")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleNewsletter = async () => {
    if (!account) return

    setNewsletterSaving(true)
    setNewsletterMessage("")
    setSaveMessage("")
    setError("")

    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsletterSubscribed: !newsletterSubscribed }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to update newsletter preference.")
        return
      }

      setNewsletterSubscribed(!!data.newsletterSubscribed)
      setAccount((prev) =>
        prev
          ? {
              ...prev,
              measurementSystem: data.measurementSystem,
              newsletterSubscribed: !!data.newsletterSubscribed,
            }
          : prev
      )

      setNewsletterMessage(
        data.newsletterSubscribed
          ? "Newsletter subscription enabled."
          : "Newsletter subscription turned off."
      )
    } catch {
      setError("Something went wrong while saving.")
    } finally {
      setNewsletterSaving(false)
    }
  }

  const handleStartCheckout = async () => {
    setCheckoutLoading(true)
    setError("")
    setBillingMessage("")

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Unable to start checkout.")
        return
      }

      if (!data.url) {
        setError("Unable to start checkout.")
        return
      }

      window.location.assign(data.url)
    } catch {
      setError("Something went wrong while starting checkout.")
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setCancelLoading(true)
    setError("")
    setBillingMessage("")

    try {
      const detailsRes = await fetch("/api/billing/subscription", { cache: "no-store" })
      const details = await detailsRes.json()

      if (!detailsRes.ok) {
        setError(details.error || "Unable to load subscription details.")
        return
      }

      if (!details.hasActiveSubscription) {
        setError("No active subscription found.")
        return
      }

      const periodEnd = formatBillingDate(details.currentPeriodEnd) || "the end of your billing period"

      if (details.cancelAtPeriodEnd) {
        setSubscriptionInfo(details)
        setBillingMessage(`Cancellation already scheduled for ${periodEnd}.`)
        return
      }

      const confirmed = window.confirm(
        `Cancel Pro at period end?\n\nYour Pro access will remain active until ${periodEnd}.`
      )
      if (!confirmed) return

      const cancelRes = await fetch("/api/billing/cancel", {
        method: "POST",
      })
      const cancelData = await cancelRes.json()

      if (!cancelRes.ok) {
        setError(cancelData.error || "Failed to schedule cancellation.")
        return
      }

      const confirmedEnd = formatBillingDate(cancelData.currentPeriodEnd) || periodEnd
      setSubscriptionInfo(cancelData)
      setBillingMessage(`Cancellation scheduled for ${confirmedEnd}.`)
    } catch {
      setError("Something went wrong while canceling your subscription.")
    } finally {
      setCancelLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white border-4 border-charcoal-900 rounded-2xl p-8 shadow-[6px_6px_0px_0px_#1a1816]">
        <p className="text-charcoal-800 font-medium animate-pulse">Loading account settings...</p>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="bg-white border-4 border-charcoal-900 rounded-2xl p-8 shadow-[6px_6px_0px_0px_#1a1816] space-y-4">
        <p className="font-bold text-tomato-600">{error || "Unable to load your account settings."}</p>
        <Button onClick={() => void loadAccount()} variant="outline" className="bg-white">
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-tomato-500/10 border-2 border-tomato-500 rounded-xl">
          <p className="text-sm font-bold text-tomato-600">{error}</p>
        </div>
      )}

      <section className="bg-white border-4 border-charcoal-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_#1a1816]">
        <div className="mb-3">
          <h2 className="font-serif text-2xl font-bold">Sign-in Email</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border-2 border-charcoal-900 bg-pasta-50">
          <div className="flex items-center gap-2 min-w-0">
            <Mail className="w-4 h-4 shrink-0 text-charcoal-800" />
            <p className="font-mono text-sm font-bold text-charcoal-900 truncate">
              {showEmail ? account.email || "No email on file" : redactEmail(account.email)}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="default"
            onClick={() => setShowEmail((prev) => !prev)}
          >
            {showEmail ? (
              <>
                <EyeOff className="w-4 h-4 mr-1" /> Hide
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1" /> Reveal
              </>
            )}
          </Button>
        </div>
      </section>

      <section className="bg-white border-4 border-charcoal-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_#1a1816]">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-charcoal-800">Subscription</p>
            <h2 className="font-serif text-2xl font-bold mt-1">Plan & Usage</h2>
          </div>
          <Badge variant={account.tier === "PRO" ? "basil" : "default"}>{account.tier}</Badge>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl border-2 border-charcoal-900 bg-pasta-50">
            <p className="text-xs font-bold uppercase text-charcoal-800">Billing</p>
            <p className="text-sm font-bold mt-1 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              {billingStatusLabel}
            </p>
          </div>
          <div className="p-3 rounded-xl border-2 border-charcoal-900 bg-pasta-50">
            <p className="text-xs font-bold uppercase text-charcoal-800">Daily generations</p>
            <p className="text-sm font-bold mt-1">
              {account.generationsToday} / {account.limits.dailyGenerations} used today
            </p>
          </div>
          <div className="p-3 rounded-xl border-2 border-charcoal-900 bg-pasta-50">
            <p className="text-xs font-bold uppercase text-charcoal-800">Max plan length</p>
            <p className="text-sm font-bold mt-1">{account.limits.maxPlanDays} days</p>
          </div>
          <div className="p-3 rounded-xl border-2 border-charcoal-900 bg-pasta-50">
            <p className="text-xs font-bold uppercase text-charcoal-800">Max members</p>
            <p className="text-sm font-bold mt-1">Up to {account.limits.maxMembers} members</p>
          </div>
        </div>

        <div className="w-full h-3 rounded-full border-2 border-charcoal-900 bg-pasta-100 overflow-hidden">
          <div
            className="h-full bg-tomato-500 transition-all"
            style={{ width: `${usagePercent}%` }}
          />
        </div>

        {account.tier === "FREE" ? (
          <div className="mt-4">
            <Button
              type="button"
              size="sm"
              variant="default"
              disabled={checkoutLoading}
              onClick={handleStartCheckout}
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Opening checkout...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" /> Upgrade to Pro
                </>
                )}
            </Button>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="bg-white"
              disabled={
                cancelLoading ||
                subscriptionLoading ||
                !subscriptionInfo?.hasActiveSubscription ||
                subscriptionInfo?.cancelAtPeriodEnd
              }
              onClick={handleCancelSubscription}
            >
              {cancelLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Scheduling cancellation...
                </>
              ) : subscriptionInfo?.cancelAtPeriodEnd ? (
                "Cancellation scheduled"
              ) : (
                "Cancel Pro at period end"
              )}
            </Button>
            {billingMessage && <p className="text-sm font-bold text-basil-600">{billingMessage}</p>}
          </div>
        )}
      </section>

      <section className="bg-white border-4 border-charcoal-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_#1a1816]">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-charcoal-800">Preferences</p>
          <h2 className="font-serif text-2xl font-bold mt-1">Units of Measurement</h2>
          <p className="text-sm font-medium text-charcoal-800 mt-2">
            Your choice affects ingredient quantities in plans and shopping lists.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <Button
            type="button"
            variant="outline"
            aria-pressed={measurementSystem === "metric"}
            className={`justify-start bg-white ${
              measurementSystem === "metric"
                ? "bg-tomato-500 text-white hover:bg-tomato-600"
                : "text-charcoal-900 hover:bg-pasta-100"
            }`}
            onClick={() => setMeasurementSystem("metric")}
          >
            <Ruler className="w-4 h-4 mr-2" /> Metric (g, kg, ml, l, C)
            {measurementSystem === "metric" && (
              <span className="ml-auto text-xs font-black uppercase tracking-wide">Selected</span>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            aria-pressed={measurementSystem === "imperial"}
            className={`justify-start bg-white ${
              measurementSystem === "imperial"
                ? "bg-tomato-500 text-white hover:bg-tomato-600"
                : "text-charcoal-900 hover:bg-pasta-100"
            }`}
            onClick={() => setMeasurementSystem("imperial")}
          >
            <Ruler className="w-4 h-4 mr-2" /> Imperial (oz, lb, cups, F)
            {measurementSystem === "imperial" && (
              <span className="ml-auto text-xs font-black uppercase tracking-wide">Selected</span>
            )}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleSaveUnits}
            disabled={isSaveDisabled}
            variant={isSaveDisabled ? "outline" : "default"}
            className={isSaveDisabled ? "bg-white" : undefined}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              "Save preference"
            )}
          </Button>
          {saveMessage && <p className="text-sm font-bold text-basil-600">{saveMessage}</p>}
        </div>
      </section>

      <section className="bg-white border-4 border-charcoal-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_#1a1816]">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-charcoal-800">Updates</p>
          <h2 className="font-serif text-2xl font-bold mt-1">Newsletter</h2>
          <p className="text-sm font-medium text-charcoal-800 mt-2">
            Receive occasional product updates, recipes, and meal-planning tips.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant={newsletterSubscribed ? "secondary" : "default"}
            disabled={newsletterSaving}
            onClick={handleToggleNewsletter}
          >
            {newsletterSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : newsletterSubscribed ? (
              "Subscribed"
            ) : (
              "Subscribe"
            )}
          </Button>

          {newsletterMessage && <p className="text-sm font-bold text-basil-600">{newsletterMessage}</p>}
        </div>
      </section>

      <section className="bg-white border-4 border-charcoal-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_#1a1816]">
        <p className="text-xs font-bold uppercase tracking-wider text-charcoal-800">Account Details</p>
        <div className="mt-2 text-sm font-medium text-charcoal-800 space-y-1">
          <p>Timezone: {timezone}</p>
          <p>Account created: {new Date(account.createdAt).toLocaleDateString()}</p>
          <p>Daily counter reset started: {new Date(account.generationsResetAt).toLocaleString()}</p>
        </div>
      </section>
    </div>
  )
}
