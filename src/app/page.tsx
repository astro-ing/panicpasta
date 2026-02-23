import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <footer className="bg-pasta-50 py-16 border-t-4 border-charcoal-900 text-center text-charcoal-800">
        <div className="container mx-auto px-4">
          <h2 className="font-serif font-black text-3xl mb-4 text-charcoal-900">PANIC Pasta</h2>
          <p className="font-medium mb-8">Stop making two dinners.</p>
          <div className="text-sm font-bold opacity-60">
            © 2026 PANIC Pasta · panicpasta.com
          </div>
        </div>
      </footer>
    </main>
  );
}
