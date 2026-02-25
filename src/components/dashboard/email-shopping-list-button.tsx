"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Mail } from "lucide-react"

interface EmailShoppingListButtonProps {
  planId: string
}

export function EmailShoppingListButton({ planId }: EmailShoppingListButtonProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleSend = async () => {
    setLoading(true)
    setMessage("")
    setError("")

    try {
      const res = await fetch(`/api/plans/${planId}/shopping-list/email`, {
        method: "POST",
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Unable to send shopping list email.")
        return
      }

      setMessage("Shopping list emailed.")
    } catch {
      setError("Something went wrong while sending the email.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-start sm:items-end gap-2">
      <Button onClick={handleSend} disabled={loading} size="lg" variant="outline" className="bg-white">
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...
          </>
        ) : (
          <>
            <Mail className="w-5 h-5 mr-2" /> Email Shopping List
          </>
        )}
      </Button>
      {message && <p className="text-sm font-bold text-basil-600">{message}</p>}
      {error && <p className="text-sm font-bold text-tomato-600">{error}</p>}
    </div>
  )
}
