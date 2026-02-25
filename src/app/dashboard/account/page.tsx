export const dynamic = "force-dynamic"

import { AccountSettings } from "@/components/dashboard/account-settings"

export default function AccountPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl font-black mb-2">Account Settings</h1>
        <p className="text-lg text-charcoal-800 font-medium">
          Manage your sign-in details, subscription status, and planning preferences.
        </p>
      </div>

      <AccountSettings />
    </div>
  )
}
