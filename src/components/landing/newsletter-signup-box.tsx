"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface NewsletterSignupBoxProps {
  isLoggedIn: boolean
  isSubscribed: boolean
}

export function NewsletterSignupBox({
  isLoggedIn,
  isSubscribed,
}: NewsletterSignupBoxProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(isSubscribed)

  const handleSubscribe = async () => {
    setError("")

    if (!isLoggedIn) {
      router.push("/auth/signin?callbackUrl=/")
      return
    }

    if (success) return

    setLoading(true)
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsletterSubscribed: true }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Could not subscribe right now.")
        return
      }

      setSuccess(!!data.newsletterSubscribed)
      router.refresh()
    } catch {
      setError("Something went wrong while subscribing.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm bg-white border-4 border-charcoal-900 rounded-2xl p-4 shadow-[6px_6px_0px_0px_#1a1816] md:ml-auto">
      <p className="text-xs font-bold uppercase tracking-wider text-charcoal-800 mb-1">Newsletter</p>
      <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-2">Kitchen tips in your inbox</h3>

      {success ? (
        <p className="text-sm font-bold text-basil-600">You&apos;re subscribed.</p>
      ) : (
        <div className="space-y-3">
          <Button type="button" onClick={handleSubscribe} size="sm" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subscribing...
              </>
            ) : isLoggedIn ? (
              "Subscribe free"
            ) : (
              "Sign in to subscribe"
            )}
          </Button>
          {error && <p className="text-sm font-bold text-tomato-600">{error}</p>}
        </div>
      )}
    </div>
  )
}
