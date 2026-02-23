"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Utensils, WheatOff, Drumstick } from "lucide-react";

export function DemoWidget() {
  const [generated, setGenerated] = useState(false);

  return (
    <div className="mx-auto max-w-2xl bg-white border-4 border-charcoal-900 rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_0px_#1a1816] text-left transform md:-rotate-1 z-20 relative transition-transform hover:rotate-0">
      {/* Input Form Mockup */}
      <div className="flex flex-col md:flex-row gap-6 items-end mb-8 border-b-2 border-charcoal-900/10 pb-8">
        <div className="flex-1 space-y-4 w-full">
          <div className="flex items-center gap-2 font-bold text-sm text-charcoal-800 uppercase tracking-wider">
            <Users className="w-4 h-4 text-tomato-500" />
            <span>Household</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-pasta-50 text-sm py-1.5 border-dashed">👩🏻 Adult</Badge>
            <Badge variant="outline" className="bg-pasta-50 text-sm py-1.5 border-dashed">👨🏽 Adult</Badge>
            <Badge variant="outline" className="bg-pasta-50 text-sm py-1.5 border-dashed">🧒🏼 Kid</Badge>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="basil" className="flex items-center gap-1 shadow-[2px_2px_0px_0px_#1a1816]"><WheatOff className="w-3 h-3"/> Dairy-Free (Adult 1)</Badge>
            <Badge variant="tomato" className="flex items-center gap-1 shadow-[2px_2px_0px_0px_#1a1816]"><Drumstick className="w-3 h-3"/> High Protein (Adult 2)</Badge>
          </div>
        </div>
        
        <Button 
          size="lg" 
          onClick={() => setGenerated(true)}
          className={`w-full md:w-auto transition-all duration-300 ${generated ? 'bg-basil-500 text-white shadow-none translate-y-1' : ''}`}
        >
          {generated ? "Plan Generated!" : "Generate Day"}
        </Button>
      </div>

      {/* Output Mockup */}
      <div className="min-h-[250px] relative">
        <AnimatePresence mode="wait">
          {!generated ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-charcoal-800/50 space-y-4"
            >
              <Utensils className="w-12 h-12 opacity-20" />
              <p className="font-medium text-center max-w-xs">Click generate to see how we solve constraint panic.</p>
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-2xl font-bold">Tuesday Dinner</h3>
                <span className="text-sm font-bold bg-pasta-200 px-3 py-1 rounded-full border-2 border-charcoal-900">35 mins</span>
              </div>
              
              <div className="bg-pasta-50 border-2 border-charcoal-900 rounded-2xl p-5 relative overflow-hidden group">
                {/* Base Meal */}
                <div className="mb-4">
                  <h4 className="text-xl font-bold mb-1">Creamy Tuscan Chicken Pasta</h4>
                  <p className="text-charcoal-800 text-sm font-medium">Base recipe: Chicken breast, sun-dried tomatoes, spinach, garlic cream sauce, penne.</p>
                </div>
                
                {/* Forks UI */}
                <div className="space-y-3 pt-4 border-t-2 border-charcoal-900/10">
                  <p className="text-xs font-bold uppercase tracking-wider text-tomato-600 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-tomato-500 animate-pulse"></span>
                    Personal Forks
                  </p>
                  
                  <div className="flex items-start gap-3 bg-white p-3 rounded-xl border-2 border-charcoal-900 shadow-[2px_2px_0px_0px_#1a1816]">
                    <div className="bg-basil-100 p-1.5 rounded-lg border-2 border-charcoal-900 mt-0.5">
                      <WheatOff className="w-4 h-4 text-basil-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Adult 1 (Dairy-Free)</p>
                      <p className="text-xs font-medium text-charcoal-800">Swap heavy cream for cashew cream base. Use nutritional yeast instead of parmesan.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-3 rounded-xl border-2 border-charcoal-900 shadow-[2px_2px_0px_0px_#1a1816]">
                    <div className="bg-tomato-100 p-1.5 rounded-lg border-2 border-charcoal-900 mt-0.5">
                      <Drumstick className="w-4 h-4 text-tomato-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Adult 2 (High Protein)</p>
                      <p className="text-xs font-medium text-charcoal-800">Add 1.5x chicken portion. Include side of edamame.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 bg-white p-3 rounded-xl border-2 border-charcoal-900 shadow-[2px_2px_0px_0px_#1a1816]">
                    <div className="bg-pasta-200 p-1.5 rounded-lg border-2 border-charcoal-900 mt-0.5">
                      <Users className="w-4 h-4 text-charcoal-900" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Kid</p>
                      <p className="text-xs font-medium text-charcoal-800">Serve pasta plain with butter, chicken and spinach separated on plate.</p>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
