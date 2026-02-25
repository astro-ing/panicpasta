"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Mail } from "lucide-react"

export function NewsletterOptInCard() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubscribe = async () => {
    setError("")

    setLoading(true)

    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsletterSubscribed: true }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Unable to subscribe right now.")
        return
      }

      if (!data.newsletterSubscribed) {
        setError("Unable to subscribe right now.")
        return
      }

      setSuccess(true)
      router.refresh()
    } catch {
      setError("Something went wrong while subscribing.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border-4 border-charcoal-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_#1a1816]">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 bg-tomato-500 border-2 border-charcoal-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#1a1816]">
          <Mail className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-serif text-2xl font-bold">Free Newsletter</h2>
          <p className="text-sm font-medium text-charcoal-800 mt-1">
            Get occasional meal-planning ideas, quick recipes, and product updates.
          </p>
        </div>
      </div>

      {success ? (
        <p className="text-sm font-bold text-basil-600">You&apos;re subscribed.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={handleSubscribe} size="sm" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subscribing...
                </>
              ) : (
                "Subscribe free"
              )}
            </Button>
            {error && <p className="text-sm font-bold text-tomato-600">{error}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
