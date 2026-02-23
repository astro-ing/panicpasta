import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-pasta-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="font-serif text-5xl font-black text-tomato-500 mb-4">Oops!</h1>
        <p className="text-xl text-charcoal-800 font-medium mb-8">
          Something went wrong with authentication. Please try again.
        </p>
        <Link href="/auth/signin">
          <Button size="lg">Try Again</Button>
        </Link>
      </div>
    </div>
  )
}
