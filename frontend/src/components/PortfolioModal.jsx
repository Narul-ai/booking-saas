import { useEffect, useState } from 'react';
import { X, Calendar, Clock, Sparkles, ImageOff } from 'lucide-react';

// =========================================================================
// 📌 БАЗА ПОРТФОЛИО БАРБЕРОВ (8 МАСТЕРОВ) - БЕЗ ИЗМЕНЕНИЙ
// =========================================================================
const CUSTOM_BARBER_PORTFOLIOS = [
  // --- Барбер 1: Classic & VIP Specialist ---
  [
    {
      id: 'b2-w1',
      title: 'Haircut & Beard Combo',
      category: 'Combo',
      price: '$50',
      duration: '60m',
      img: 'https://images.pexels.com/photos/19140177/pexels-photo-19140177.jpeg?auto=compress&cs=tinysrgb&w=800',
      description: 'Precision cut combined with beard sculpting and hot towel treatment.'
    },
    {
      id: 'b1-w2',
      title: 'Executive Haircut',
      category: 'Haircut',
      price: '$35',
      duration: '45m',
      img: 'https://images.pexels.com/photos/5337945/pexels-photo-5337945.jpeg?auto=compress&cs=tinysrgb&w=800',
      description: 'Precision cut tailored to your head shape, including scalp massage, wash, and luxury finish.'
    },
    {
      id: 'b1-w3',
      title: 'Beard Trim & Styling',
      category: 'Beard',
      price: '$25',
      duration: '30m',
      img: 'https://images.pexels.com/photos/3998419/pexels-photo-3998419.jpeg?auto=compress&cs=tinysrgb&w=800',
      description: 'Hot towel beard sculpting, razor edging, and deep essential oil conditioning treatment.'
    },
    {
      id: 'b1-w4',
      title: 'Black Mask & Deep Cleansing',
      category: 'Facial',
      price: '$15',
      duration: '20m',
      img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcScTE7OZpoCGSZBpXhHm0gpYaqVP6q804kjRKfNuCUzQA&s=10',
      description: 'Deep pore cleansing, blackhead extraction, hydrating skin mask, and cold towel refresh.'
    }
  ],

  // --- Барбер 2: Combo & Family Master ---
  [
    {
      id: 'b1-w1',
      title: 'VIP Executive Experience',
      category: 'Signature',
      price: '$75',
      duration: '90m',
      img: 'https://images.pexels.com/photos/7447131/pexels-photo-7447131.jpeg?auto=compress&cs=tinysrgb&w=800',
      description: 'The ultimate signature experience. Precision cut, full beard detailing, scalp massage, and facial revival.'
    },
    {
      id: 'b2-w2',
      title: 'Father & Son Combo',
      category: 'Package',
      price: '$50',
      duration: '60m',
      img: 'https://afocirmbqdxnkyescnev.supabase.co/storage/v1/object/public/featured-images/5fda2ac6-c38a-437c-a7e9-945fc0a829ab/ef0745ad-1ee0-4766-be67-b141b582d744.webp?auto=compress&cs=tinysrgb&w=800',
      description: 'A shared grooming experience with precision cuts for both father and son.'
    },
    {
      id: 'b2-w3',
      title: 'Junior Gentleman Haircut',
      category: 'Kids',
      price: '$22',
      duration: '30m',
      img: 'https://rumbie.co/wp-content/uploads/2026/07/crew-cut-for-boys-classic-haircuts-kids-haircut-boy.png.webp?auto=compress&cs=tinysrgb&w=800',
      description: 'Patient and stylish haircut tailored specifically for kids and teens.'
    },
    {
      id: 'b2-w4',
      title: 'Scalp Detox & Massage',
      category: 'Care',
      price: '$20',
      duration: '20m',
      img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQueDX4SS6AGzTB0LAAQdfbeyoE9efs2kdtFwL4RX18Ng&s=10?auto=compress&cs=tinysrgb&w=800',
      description: 'Premium scalp cleansing and relaxing massage using top-tier professional products.'
    }
  ],

  // --- Барбер 3: Modern Cuts & Shaving Expert ---
  [
    {
      id: 'b3-w1',
      title: 'Buzz Cut & Fade',
      category: 'Haircut',
      price: '$25',
      duration: '30m',
      img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5ha5A7PGCqjK9sED0fvJaysos39LH2hfQauLjjA4-OQ&s=10?auto=compress&cs=tinysrgb&w=800',
      description: 'Clean uniform buzz top paired with a sharp, seamless skin fade.'
    },
    {
      id: 'b3-w2',
      title: 'Royal Hot Towel Shave',
      category: 'Shave',
      price: '$40',
      duration: '45m',
      img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmWzvv-x4KYf-Q8u9ch7UXTl6pWG5YogT86AhB-yQ-Xg&s=10?auto=compress&cs=tinysrgb&w=800',
      description: 'Traditional straight-razor shave with hot towel treatment and essential oils.'
    },
    {
      id: 'b3-w3',
      title: 'Long Hair Styling & Cut',
      category: 'Styling',
      price: '$45',
      duration: '60m',
      img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqT40tCvAVpPIs1IaRh9rdhKeLzyQCyplqBiWWdWC_ig&s=10?auto=compress&cs=tinysrgb&w=800',
      description: 'Precision scissor craftsmanship for medium to long male hairstyles.'
    },
    {
      id: 'b3-w4',
      title: 'Head Shave (Hot Towel)',
      category: 'Shave',
      price: '$30',
      duration: '45m',
      img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFTiUtukbsKrEdz_FUF_wuQuEcS2xl1fWxJ5TAttVMrw&s=10?auto=compress&cs=tinysrgb&w=800',
      description: 'Smooth and relaxing hot towel head shave with a straight razor.'
    }
  ],

  // --- Барбер 4: Care & Express Grooming ---
  [
    {
      id: 'b4-w1',
      title: 'Hair Gray Camouflage',
      category: 'Color',
      price: '$25',
      duration: '25m',
      img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3D8h9K0IlS9YLz6q-mb0DMgsNrwF29-00mc6CTmCsWw&s=10?auto=compress&cs=tinysrgb&w=800',
      description: 'Natural gray hair blending for a subtle, youthful appearance.'
    },
    {
      id: 'b4-w2',
      title: 'Beard Trim & Styling',
      category: 'Beard',
      price: '$25',
      duration: '30m',
      img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsPzkVhIuVy0xztgjgu5TYs7LNNoLRstL24zwvgEaevg&s=10?auto=compress&cs=tinysrgb&w=800',
      description: 'Hot towel beard sculpting, razor edging, and conditioning treatment.'
    },
    {
      id: 'b4-w3',
      title: 'Nose & Ear Waxing',
      category: 'Care',
      price: '$10',
      duration: '15m',
      img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDL52WEBKNBEjJJLrhvV5odxZi6PIa4oVVSAzMM9JfRw&s=10?auto=compress&cs=tinysrgb&w=800',
      description: 'Quick, painless, and highly effective hair removal for a clean look.'
    },
    {
      id: 'b4-w4',
      title: 'Haircut & Beard Combo',
      category: 'Combo',
      price: '$50',
      duration: '60m',
      img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCCUUpGAgwkYq9oZRXRcvvkb8NC8aKP7QsKnooOQIfZQ&s=10?auto=compress&cs=tinysrgb&w=800',
      description: 'Precision cut tailored to your head shape and complete beard styling.'
    }
  ],

  // --- Барбер 5: Fade & Modern Barber ---
  [
    {
      id: 'b5-w1',
      title: 'Buzz Cut & Fade',
      category: 'Haircut', 
      price: '$25', 
      duration: '30m',
      img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRAYUfrYQm4plxaYNHJf4Q16mBdaeXP692I1YqPAJQeuA&s=10?auto=compress&cs=tinysrgb&w=800',
      description: 'Clean uniform buzz top paired with a sharp, seamless skin fade.'
    },
    {
      id: 'b5-w2',
      title: 'Haircut & Beard Combo',
      category: 'Combo', 
      price: '$50',
      duration: '60m',
      img: 'https://i.pinimg.com/736x/9c/5a/e4/9c5ae40a36c0d60ebab06df3c454888f.jpg?auto=compress&cs=tinysrgb&w=800',
      description: 'Precision cut combined with beard sculpting and hot towel treatment.'
    },
    {
      id: 'b5-w3',
      title: 'Nose & Ear Waxing',
      category: 'Care', 
      price: '$10', 
      duration: '15m',
      img: 'https://i.pinimg.com/1200x/29/db/56/29db567305130ca41ddee433583a84ce.jpg?auto=compress&cs=tinysrgb&w=800',
      description: 'Quick, painless, and highly effective hair removal for a clean look.'
    },
    {
      id: 'b5-w4',
      title: 'Black Mask & Deep Cleansing',
      category: 'Facial',
      price: '$15',
      duration: '20m',
      img: 'https://i.pinimg.com/1200x/81/77/9c/81779c95cd9c84992424b4887889ff93.jpg?auto=compress&cs=tinysrgb&w=800',
      description: 'Deep pore cleansing, blackhead extraction, and cold towel refresh.'
    }
  ],

  // --- Барбер 6: Executive & Shaving Master ---
  [
    {
      id: 'b6-w1',
      title: 'Executive Haircut',
      category: 'Haircut',
      price: '$35',
      duration: '45m',
      img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZ2w4lZOxLg5fsNwpbdX0Zg1xB0_lvmOFzpdS_1IWIxbsm0Jw22eoy0PZs&s=10?auto=compress&cs=tinysrgb&w=800',
      description: 'Classic professional styling with sharp contours for business leaders.'
    },
    {
      id: 'b6-w2',
      title: 'Royal Hot Towel Shave', 
      category: 'Shave', 
      price: '$40',
      duration: '45m',
      img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFifXZoVuW-2F6I3U1fVSt-6oUOyfpiVrfixeQXIg2QQ&s=10?auto=compress&cs=tinysrgb&w=800', 
      description: 'Traditional straight-razor shave with hot towel treatment.'
    },
    {
      id: 'b6-w3',
      title: 'Hair Gray Camouflage',
      category: 'Color', 
      price: '$25', 
      duration: '25m',
      img: 'https://i.pinimg.com/736x/d4/6e/07/d46e07217bd5af689a402bf2b1aa123f.jpg?auto=compress&cs=tinysrgb&w=800',
      description: 'Natural gray hair blending for a subtle, youthful appearance.'
    },
    {
      id: 'b6-w4',
      title: 'Scalp Detox & Massage',
      category: 'Care',
      price: '$20',
      duration: '20m',
      img: 'https://i.pinimg.com/1200x/02/77/6c/02776c7e7b5661db604013cb0d506e53.jpg?auto=compress&cs=tinysrgb&w=800',
      description: 'Premium scalp cleansing and relaxing massage.'
    }
  ],

  // --- Барбер 7: VIP & Long Hair Specialist ---
  [
    {
      id: 'b7-w1',
      title: 'VIP Executive Experience',
      category: 'Signature',
      price: '$75', 
      duration: '90m',
      img: 'https://i.pinimg.com/736x/6f/4c/ec/6f4cec79e7236c2dc7ea5728ddfc5860.jpg?auto=compress&cs=tinysrgb&w=800s',
      description: 'The ultimate signature experience. Precision cut, full beard detailing, scalp massage.'
    },
    {
      id: 'b7-w2',
      title: 'Long Hair Styling & Cut', 
      category: 'Styling', 
      price: '$45', 
      duration: '60m',
      img: 'https://i.pinimg.com/1200x/9a/23/12/9a2312c6d50fb267df655711c9798f58.jpg?auto=compress&cs=tinysrgb&w=800s',
      description: 'Precision scissor craftsmanship for medium to long male hairstyles.'
    },
    {
      id: 'b7-w3',
      title: 'Father & Son Combo', 
      category: 'Package',
      price: '$50',
      duration: '60m',
      img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsjL9dJ66nw39yLTUAr3XsBDanUNcfUVb8B362w_y-H2b_vpfGRlft4867&s=10?auto=compress&cs=tinysrgb&w=800s',
      description: 'A shared grooming experience with precision cuts for both.'
    },
    {
      id: 'b7-w4',
      title: 'Beard Trim & Styling', 
      category: 'Beard',
      price: '$25', 
      duration: '30m',
      img: 'https://i.pinimg.com/736x/53/68/da/5368da011515917a966738b72d79b40d.jpg?auto=compress&cs=tinysrgb&w=800s', 
      description: 'Hot towel beard sculpting, razor edging, and conditioning treatment.'
    }
  ],

  // --- Барбер 8: Head Shave & Express Grooming ---
  [
    {
      id: 'b8-w1',
      title: 'Head Shave (Hot Towel)',
      category: 'Shave', 
      price: '$30',
      duration: '45m',
      img: 'https://i.pinimg.com/736x/66/31/f4/6631f4e8ae320bd69a7ea2735d6a63c2.jpg?auto=compress&cs=tinysrgb&w=800s',
      description: 'Smooth and relaxing hot towel head shave with a straight razor.'
    },
    {
      id: 'b8-w2',
      title: 'Junior Gentleman Haircut', 
      category: 'Kids', 
      price: '$22',
      duration: '30m',
      img: 'https://i.pinimg.com/1200x/b0/01/a2/b001a2d9743e1335874b33e34075cfd2.jpg?auto=compress&cs=tinysrgb&w=800s',
      description: 'Patient and stylish haircut tailored specifically for kids and teens.'
    },
    {
      id: 'b8-w3',
      title: 'Nose & Ear Waxing',
      category: 'Care',
      price: '$10', 
      duration: '15m',
      img: 'https://i.pinimg.com/1200x/d2/a2/94/d2a2948356628160f8a4fe07578535fe.jpg?auto=compress&cs=tinysrgb&w=800s', 
      description: 'Quick, painless, and highly effective hair removal.'
    },
    {
      id: 'b8-w4',
      title: 'Black Mask & Deep Cleansing',
      category: 'Facial', 
      price: '$15',
      duration: '20m',
      img: 'https://i.pinimg.com/736x/7e/e5/85/7ee5857ba461b707804aec0cbbc9b9e5.jpg?auto=compress&cs=tinysrgb&w=800s',
      description: 'Deep pore cleansing, blackhead extraction, and cold towel refresh.'
    }
  ]
];

// Вспомогательный компонент для надежной загрузки картинок с фоллбэком
function PortfolioImage({ src, alt, category }) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src || !src.startsWith('http')) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800/90 text-zinc-500 border border-zinc-700/50 p-4">
        <ImageOff size={28} className="mb-2 text-amber-500/60" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 text-center">{category} Showcase</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      onError={() => setHasError(true)}
      loading="lazy"
      className="w-full h-full object-cover group-hover:scale-105 group-hover:rotate-1 transition-all duration-700 ease-out"
    />
  );
}

export default function PortfolioModal({ isOpen, onClose, barber, onSelectWork }) {
  // Блокировка фонового скролла и обработка клавиши Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !barber) return null;

  // Определение портфолио для текущего барбера
  const getBarberWorks = () => {
    if (typeof barber.barberIdx === 'number') {
      return CUSTOM_BARBER_PORTFOLIOS[barber.barberIdx % CUSTOM_BARBER_PORTFOLIOS.length];
    }
    if (typeof barber.index === 'number') {
      return CUSTOM_BARBER_PORTFOLIOS[barber.index % CUSTOM_BARBER_PORTFOLIOS.length];
    }

    // Хэш по уникальному ключу, если явный индекс не передан
    const uniqueKey = String(barber._id || barber.id || barber.name || 'default');
    let hash = 0;
    for (let i = 0; i < uniqueKey.length; i++) {
      hash = uniqueKey.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const targetIdx = Math.abs(hash) % CUSTOM_BARBER_PORTFOLIOS.length;
    return CUSTOM_BARBER_PORTFOLIOS[targetIdx];
  };

  const works = getBarberWorks();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Анимированный Backdrop */}
      <div 
        className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xl transition-opacity animate-in fade-in duration-300"
        onClick={onClose} 
      />

      {/* Контейнер модалки */}
      <div className="relative w-full max-w-5xl bg-zinc-900 border border-zinc-800/80 rounded-[2rem] shadow-2xl shadow-black/60 overflow-hidden z-10 flex flex-col my-auto animate-in slide-in-from-bottom-8 duration-500 max-h-[90vh]">
        
        {/* Хедер с Glassmorphism */}
        <div className="p-6 md:px-8 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/90 backdrop-blur-xl shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img 
                src={barber.avatarUrl || barber.avatar || 'https://via.placeholder.com/150'} 
                alt={barber.name || 'Master'} 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/30 shadow-lg shadow-amber-500/10"
              />
              <div className="absolute -bottom-2 -right-2 bg-amber-500 text-zinc-950 rounded-full p-1 shadow-md">
                <Sparkles size={14} className="fill-current" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-2xl font-black text-white tracking-tight">{barber.name || 'Master Barber'}</h3>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {barber.displayTitle || barber.position || 'Top Stylist'}
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-1 font-medium">Signature Services & Pricing</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer group shrink-0"
            aria-label="Close modal"
          >
            <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Сетка Услуг с Кастомным Скроллом */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar bg-zinc-950/30 flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-zinc-900 [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-amber-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {works.map((work, idx) => (
              <div 
                key={`${work.id}-${idx}`}
                className="group flex flex-col bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/50 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/5"
              >
                {/* Картинка с градиентом */}
                <div className="relative aspect-[16/10] overflow-hidden bg-zinc-800">
                  <PortfolioImage src={work.img} alt={work.title} category={work.category} />

                  {/* Оверлей градиент */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none" />
                  
                  {/* Бейджи на картинке */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-700/50 text-[10px] font-black text-white uppercase tracking-widest shadow-lg">
                      {work.category}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <div className="bg-zinc-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-zinc-700/50 text-[11px] font-bold text-zinc-200 flex items-center gap-1.5 shadow-lg">
                      <Clock size={12} className="text-amber-400" />
                      {work.duration}
                    </div>
                  </div>
                </div>

                {/* Контент под картинкой */}
                <div className="p-6 flex flex-col flex-grow justify-between gap-6">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h4 className="text-lg font-black text-white leading-tight group-hover:text-amber-400 transition-colors">
                        {work.title}
                      </h4>
                      <span className="text-base font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 shrink-0">
                        {work.price}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed font-medium line-clamp-3">
                      {work.description}
                    </p>
                  </div>

                  {/* Кнопка записи (передаем мастера и объект работы) */}
                  <button
                    onClick={() => {
                      if (typeof onSelectWork === 'function') {
                        onSelectWork(barber, work);
                      }
                      onClose();
                    }}
                    className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-amber-400 text-zinc-950 font-black text-sm uppercase tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-white/5 hover:shadow-amber-400/20 active:scale-[0.98]"
                  >
                    <Calendar size={16} />
                    <span>Book For {work.price}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Футер */}
        <div className="p-5 border-t border-zinc-800/80 bg-zinc-900/90 backdrop-blur-xl flex items-center justify-between shrink-0">
          <p className="text-xs font-medium text-zinc-500">
            All services include consultation & premium finish by <span className="text-zinc-300">{barber.name || 'Master'}</span>.
          </p>
          <button 
            onClick={onClose}
            className="text-amber-400 font-bold text-sm hover:text-amber-300 transition-colors uppercase tracking-wider px-2 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}