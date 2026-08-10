import { MapPin, Phone, Clock, Mail, Navigation } from 'lucide-react';

export default function ContactsSection() {
  return (
    <section id="contacts" className="w-full bg-zinc-950 py-24 border-t border-zinc-800/80 text-zinc-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 bg-amber-950/60 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-amber-400 text-xs font-black uppercase tracking-wide">
            <MapPin size={14} />
            <span>Visit Our Lounge</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Location & <span className="text-amber-400">Contacts</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-medium">
           We are located right in the heart of the city. Stop by for a haircut or just drop in for a coffee.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Инфо карточка 1 */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-4 hover:border-amber-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <MapPin size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Address</h3>
              <p className="text-sm text-zinc-400 mt-1">42 Central Avenue, Downtown</p>
              <p className="text-xs text-zinc-500 mt-0.5">Convenient parking right next to the salon.</p>
            </div>
          </div>

          {/* Инфо карточка 2 */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-4 hover:border-amber-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Working Hours</h3>
              <p className="text-sm text-zinc-400 mt-1">Mon - Sun: 09:00 AM – 09:00 PM</p>
              <p className="text-xs text-emerald-400 font-bold mt-0.5">Open 7 days a week, no breaks.</p>
            </div>
          </div>

          {/* Инфо карточка 3 */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-4 hover:border-amber-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Phone size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Phone & Direct</h3>
              <p className="text-sm text-zinc-400 mt-1">+1 (555) 000-0000</p>
              <p className="text-xs text-zinc-500 mt-0.5">info@topgunbarber.com</p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}