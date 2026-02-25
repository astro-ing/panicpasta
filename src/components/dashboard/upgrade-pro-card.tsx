"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"

export function UpgradeProCard() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleUpgrade = async () => {
    setLoading(true)
    setError("")

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
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border-4 border-charcoal-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_#1a1816]">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 bg-tomato-500 border-2 border-charcoal-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#1a1816]">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-serif text-2xl font-bold">Upgrade to Pro</h2>
          <p className="text-sm font-medium text-charcoal-800 mt-1">
            Unlock pantry mode, up to 6 members, and 3 plan generations per day.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Button type="button" onClick={handleUpgrade} size="sm" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opening checkout...
            </>
          ) : (
            "Upgrade to Pro"
          )}
        </Button>
        {error && <p className="text-sm font-bold text-tomato-600">{error}</p>}
      </div>
    </div>
  )
}
