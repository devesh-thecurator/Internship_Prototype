import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Bell, User, Settings, LogOut, ChevronDown, Menu } from 'lucide-react';
import { createDefaultTelemetry, getStoredValidationTelemetry, VALIDATION_EVENT } from '../lib/validationTelemetry';

export default function TopBar({ user, onLogout, onMenuClick }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [telemetry, setTelemetry] = useState(() => getStoredValidationTelemetry() || createDefaultTelemetry());
  const [notifications] = useState([
    { id: 1, message: 'EV battery validation completed', time: '2 min ago' },
    { id: 2, message: 'Cybersecurity clause risk detected', time: '5 min ago' },
    { id: 3, message: 'PPAP evidence package ready', time: '11 min ago' },
  ]);

  useEffect(() => {
    const syncTelemetry = (event) => {
      const nextTelemetry = event.detail || getStoredValidationTelemetry();
      if (nextTelemetry) setTelemetry(nextTelemetry);
    };

    window.addEventListener(VALIDATION_EVENT, syncTelemetry);
    window.addEventListener('storage', syncTelemetry);
    return () => {
      window.removeEventListener(VALIDATION_EVENT, syncTelemetry);
      window.removeEventListener('storage', syncTelemetry);
    };
  }, []);

  return (
    <motion.div
      className="mb-8 flex flex-col gap-5 text-white"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200">
            Automotive AI Cockpit
          </p>
          <h2 className="bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-3xl font-bold text-transparent">
            Validation Intelligence
          </h2>
        </motion.div>

        <motion.div
          className="flex flex-wrap items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="rounded-xl border border-cyan-300/20 bg-slate-950/80 p-2 shadow-sm backdrop-blur-xl transition hover:bg-cyan-300/10 lg:hidden"
          >
            <Menu className="h-5 w-5 text-cyan-100" />
          </button>
          {/* Search Bar */}
          <div className="relative min-w-[220px] flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-500" />
            <input
              type="text"
              placeholder="Search OEMs, suppliers, programs, clauses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-cyan-300/15 bg-slate-950/80 py-3 pl-10 pr-4 text-sm font-semibold text-white shadow-sm backdrop-blur-xl transition placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-4 focus:ring-cyan-300/10 md:w-96"
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications((value) => !value)}
              className="relative rounded-xl border border-cyan-300/15 bg-slate-950/80 p-3 shadow-sm backdrop-blur-xl transition hover:bg-cyan-300/10"
            >
              <Bell className="h-5 w-5 text-cyan-100" />
              {notifications.length > 0 && (
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-rose-500"></span>
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  className="absolute right-0 z-30 mt-2 w-80 rounded-2xl border border-cyan-300/15 bg-slate-950/95 p-3 shadow-[0_24px_70px_rgba(0,0,0,0.36)] backdrop-blur-xl"
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                >
                  {notifications.map((notification) => (
                    <div key={notification.id} className="rounded-xl p-3 transition hover:bg-cyan-300/10">
                      <p className="text-sm font-black text-white">{notification.message}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">{notification.time}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 rounded-2xl border border-cyan-300/15 bg-slate-950/80 p-2 shadow-sm backdrop-blur-xl transition hover:bg-cyan-300/10"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300">
                <User className="h-4 w-4 text-slate-950" />
              </div>
              <span className="hidden text-sm font-black text-slate-200 md:block">
                {user?.email || user?.username || 'Guest'}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  className="absolute right-0 z-30 mt-2 w-56 rounded-2xl border border-cyan-300/15 bg-slate-950/95 py-2 shadow-[0_24px_70px_rgba(0,0,0,0.36)] backdrop-blur-xl"
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                >
                  <div className="border-b border-white/10 px-4 py-3">
                    <p className="text-sm font-black text-white">
                      {user?.email || user?.username || 'Guest'}
                    </p>
                    <p className="text-xs font-medium text-slate-500">Premium Account</p>
                  </div>
                  <button className="flex w-full items-center gap-3 px-4 py-2 text-sm font-bold text-slate-300 transition-colors hover:bg-cyan-300/10">
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm font-bold text-slate-300 transition-colors hover:bg-cyan-300/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Quick Stats Bar */}
      <motion.div
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="rounded-2xl border border-cyan-300/15 bg-slate-950/75 p-4 shadow-sm backdrop-blur-xl">
          <p className="text-xs uppercase tracking-wide text-slate-500">Compliance</p>
          <p className="text-2xl font-bold text-cyan-200">{telemetry.complianceScore || 0}%</p>
        </div>
        <div className="rounded-2xl border border-cyan-300/15 bg-slate-950/75 p-4 shadow-sm backdrop-blur-xl">
          <p className="text-xs uppercase tracking-wide text-slate-500">Semantic Match</p>
          <p className="text-2xl font-bold text-emerald-300">{telemetry.semanticMatch || 0}%</p>
        </div>
        <div className="rounded-2xl border border-cyan-300/15 bg-slate-950/75 p-4 shadow-sm backdrop-blur-xl">
          <p className="text-xs uppercase tracking-wide text-slate-500">Supplier Risk</p>
          <p className="text-2xl font-bold text-amber-300">{telemetry.supplierRisk || 0}%</p>
        </div>
        <div className="rounded-2xl border border-cyan-300/15 bg-slate-950/75 p-4 shadow-sm backdrop-blur-xl">
          <p className="text-xs uppercase tracking-wide text-slate-500">AI Confidence</p>
          <p className="text-2xl font-bold text-emerald-300">{telemetry.aiConfidence || 0}%</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
