"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"

const UPGRADE_NAV_PATHS = new Set(["/dashboard/household", "/dashboard/plans", "/dashboard/plans/new"])

export function UpgradeProNavButton() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)

  if (!UPGRADE_NAV_PATHS.has(pathname)) {
    return null
  }

  const handleUpgrade = async () => {
    setLoading(true)

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
      })
      const data = await res.json()

      if (!res.ok || !data.url) {
        window.alert(data.error || "Unable to start checkout.")
        return
      }

      window.location.assign(data.url)
    } catch {
      window.alert("Something went wrong while starting checkout.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button type="button" size="sm" onClick={handleUpgrade} disabled={loading} className="h-9 px-3">
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          <span className="hidden sm:inline">Opening...</span>
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Upgrade</span>
        </>
      )}
    </Button>
  )
}
