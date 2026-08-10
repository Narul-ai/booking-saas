import { Award, ShieldCheck, Sparkles, Coffee } from 'lucide-react';

export default function AboutSection() {
  return (
    <section id="about" className="w-full bg-zinc-950 py-12 sm:py-20 lg:py-24 border-t border-zinc-800/80 text-zinc-100 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Левый блок с описанием */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-950/60 to-amber-900/30 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-amber-400 text-[11px] xs:text-xs font-black tracking-wide uppercase">
                <Sparkles size={14} className="shrink-0" />
                <span>Gentlemen Lounge Philosophy</span>
              </div>
            </div>

            <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              More Than Just a <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">Haircut</span>
            </h2>

            <p className="text-xs xs:text-sm text-zinc-400 leading-relaxed font-medium">
              TopGun is a space with a strong masculine character, where classic barbering traditions meet modern style. We’ve built the atmosphere of a welcoming club where you can escape the hustle and bustle of the city, enjoy great coffee or drinks, and trust your look to the professionals.
            </p>

            {/* Фичи */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 flex items-start gap-3">
                <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  <Award size={18} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Top Certified Masters</h4>
                  <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 leading-snug">Experienced barbers continuously refining their craft.</p>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 flex items-start gap-3">
                <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  <Coffee size={18} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Premium Lounge Bar</h4>
                  <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 leading-snug">Complimentary drink or fresh bean-to-cup coffee for every client.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Правый блок с фото/статистикой */}
          <div className="relative mt-2 lg:mt-0">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=800" 
                alt="Barbershop Interior" 
                className="w-full h-[280px] xs:h-[340px] sm:h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-90" />
              
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-950/85 backdrop-blur-md border border-zinc-800 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2.5">
                <div>
                  <p className="text-[10px] sm:text-xs text-amber-400 font-extrabold uppercase tracking-wider">Since 2020</p>
                  <p className="text-xs sm:text-sm font-black text-white">5,000+ Satisfied Clients</p>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] sm:text-xs font-bold bg-emerald-950/80 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-emerald-500/30 shrink-0">
                  <ShieldCheck size={14} className="shrink-0" />
                  <span>Verified Quality</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}