import { UtensilsCrossed, CalendarCheck, Settings2 } from "lucide-react";

export function Features() {
  const features = [
    {
      title: "Household constraints, solved.",
      description: "Vegan partner? Gluten-free kid? You on a protein kick? Enter everyone's rules once, and we'll never suggest a meal that breaks them.",
      icon: <Settings2 className="w-8 h-8 text-white" />,
      color: "bg-tomato-500",
    },
    {
      title: "Personalized swaps (forks)",
      description: "Stop making two dinners. We generate one base recipe with automatic 'forks'—simple modifications so everyone eats together.",
      icon: <UtensilsCrossed className="w-8 h-8 text-white" />,
      color: "bg-basil-500",
    },
    {
      title: "One click → plan + shopping",
      description: "Generate a whole week in seconds. We organize the shopping list by category (produce, pantry, protein) so you can get in and out.",
      icon: <CalendarCheck className="w-8 h-8 text-white" />,
      color: "bg-charcoal-800",
    }
  ];

  return (
    <section id="features" className="py-32 bg-pasta-100 border-y-4 border-charcoal-900 relative scroll-mt-28">
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Why PANIC Pasta?</h2>
          <p className="text-xl md:text-2xl text-charcoal-800 max-w-2xl mx-auto font-medium">
              Because meal planning for multiple people is a logic puzzle you shouldn&apos;t have to solve every Sunday.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="bg-white border-4 border-charcoal-900 rounded-[2rem] p-8 shadow-[8px_8px_0px_0px_#1a1816] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_#1a1816] transition-all duration-300 group">
              <div className={`w-16 h-16 ${feature.color} border-4 border-charcoal-900 rounded-2xl flex items-center justify-center mb-8 transform -rotate-6 group-hover:rotate-0 transition-transform shadow-[4px_4px_0px_0px_#1a1816]`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold font-serif mb-4 leading-tight">{feature.title}</h3>
              <p className="text-charcoal-800 font-medium leading-relaxed text-lg">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
