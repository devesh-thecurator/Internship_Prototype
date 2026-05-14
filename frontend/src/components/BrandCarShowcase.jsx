import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Gauge, Sparkles, Zap } from 'lucide-react';

const cars = [
  {
    brand: 'Tesla',
    model: 'Model Y electric validation',
    image: '/car-brand-images/tesla.jpg',
    accent: '#f43f5e',
    glow: 'rgba(244,63,94,0.34)',
    metric: 'EV range logic',
  },
  {
    brand: 'BMW',
    model: '5 Series production intelligence',
    image: '/car-brand-images/bmw.jpg',
    accent: '#3b82f6',
    glow: 'rgba(59,130,246,0.34)',
    metric: 'Assembly quality',
  },
  {
    brand: 'Mercedes-Benz',
    model: 'AMG supplier risk cockpit',
    image: '/car-brand-images/mercedes.jpg',
    accent: '#e5e7eb',
    glow: 'rgba(229,231,235,0.28)',
    metric: 'Luxury compliance',
  },
  {
    brand: 'Audi',
    model: 'A5 logistics validation',
    image: '/car-brand-images/audi.jpg',
    accent: '#22d3ee',
    glow: 'rgba(34,211,238,0.32)',
    metric: 'JIT stability',
  },
  {
    brand: 'Porsche',
    model: '911 performance sourcing',
    image: '/car-brand-images/porsche.jpg',
    accent: '#f59e0b',
    glow: 'rgba(245,158,11,0.34)',
    metric: 'Performance clauses',
  },
];

function CarAsset({ car, active, compact = false }) {
  const [missing, setMissing] = useState(false);

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl bg-black/25 ${compact ? 'min-h-[96px]' : 'min-h-[180px]'}`}
      animate={active ? { y: [0, -5, 0] } : { y: 0 }}
      transition={{ duration: 2.8, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
    >
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${car.glow}, transparent 46%)`,
        }}
      />
      <motion.div
        className="absolute left-[-30%] top-8 h-px w-[160%]"
        style={{ background: `linear-gradient(90deg, transparent, ${car.accent}, transparent)` }}
        animate={{ x: ['-20%', '20%', '-20%'] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-8 left-8 right-8 h-px opacity-80"
        style={{ background: `linear-gradient(90deg, transparent, ${car.accent}, transparent)` }}
        animate={{ scaleX: [0.72, 1, 0.72] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {!missing && (
        <motion.img
          src={car.image}
          alt={`${car.brand} car`}
          className={`relative z-10 mx-auto w-full object-contain drop-shadow-[0_24px_28px_rgba(0,0,0,0.45)] ${
            compact ? 'h-24 px-2 pt-5' : 'h-40 px-4 pt-8'
          }`}
          onError={() => setMissing(true)}
          animate={active ? { x: [-8, 8, -8], scale: [1, 1.035, 1] } : { x: 0, scale: 0.98 }}
          transition={{ duration: 3.2, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
        />
      )}

      {missing && (
        <div className={`relative z-10 flex items-center justify-center px-5 text-center ${compact ? 'h-24 pt-5' : 'h-40 pt-8'}`}>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{car.brand} image missing</p>
            {!compact && <p className="mt-2 text-sm font-semibold text-slate-500">{car.image}</p>}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function BrandCarShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeCar = cars[activeIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % cars.length);
    }, 3600);

    return () => window.clearInterval(timer);
  }, []);

  const move = (direction) => {
    setActiveIndex((index) => (index + direction + cars.length) % cars.length);
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-4">
        <div
          className="absolute inset-0 opacity-70"
          style={{ background: `radial-gradient(circle at 58% 18%, ${activeCar.glow}, transparent 44%)` }}
        />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Featured brand</p>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCar.brand}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.28 }}
              >
                <h3 className="mt-2 text-2xl font-black text-white">{activeCar.brand}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-300">{activeCar.model}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => move(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15"
              aria-label="Previous brand"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15"
              aria-label="Next brand"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCar.brand}
              initial={{ opacity: 0, x: 42, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -42, scale: 0.96 }}
              transition={{ duration: 0.42, ease: 'easeOut' }}
            >
              <CarAsset car={activeCar} active />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative mt-4 grid grid-cols-3 gap-3 text-xs sm:grid-cols-3">
          {[
            { label: 'AI fit', value: '97%', icon: Sparkles },
            { label: 'Speed', value: 'Live', icon: Zap },
            { label: activeCar.metric, value: 'Active', icon: Gauge },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.07] p-3">
              <item.icon className="mb-2 h-4 w-4" style={{ color: activeCar.accent }} />
              <p className="font-black text-white">{item.value}</p>
              <p className="mt-1 text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {cars.map((car, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={car.brand}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`group overflow-hidden rounded-2xl border p-2 text-left transition ${
                active ? 'border-white/30 bg-white/[0.12]' : 'border-white/10 bg-white/[0.05] hover:bg-white/[0.08]'
              }`}
            >
              <CarAsset car={car} active={active} compact />
              <div className="mt-3 flex items-center justify-between gap-2 px-1 pb-1">
                <div>
                  <p className="text-sm font-black text-white">{car.brand}</p>
                  <p className="text-[11px] font-semibold text-slate-500">{car.metric}</p>
                </div>
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: car.accent, boxShadow: active ? `0 0 18px ${car.accent}` : 'none' }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
