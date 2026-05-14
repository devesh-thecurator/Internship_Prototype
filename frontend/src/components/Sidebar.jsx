import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Upload,
  CheckCircle,
  Download,
  MessageSquare,
  Settings,
  Shield,
  TrendingUp,
  X,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Upload', to: '/upload', icon: Upload },
  { label: 'Validate', to: '/validate', icon: CheckCircle },
  { label: 'Export', to: '/export', icon: Download },
  { label: 'Chatbot', to: '/chatbot', icon: MessageSquare },
  { label: 'Admin Panel', to: '/admin', icon: Settings },
];

const sidebarVariants = {
  hidden: { x: -300, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1 },
};

export default function Sidebar({ user, onClose }) {
  return (
    <motion.aside
      className="flex h-full w-80 flex-col border-r border-cyan-300/15 bg-slate-950/95 text-white shadow-[0_24px_70px_rgba(0,0,0,0.38)] backdrop-blur-xl lg:w-72"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="p-6">
        <motion.div
          className="flex items-center justify-between gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300 shadow-[0_0_32px_rgba(34,211,238,.32)]">
              <Shield className="h-6 w-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-lg font-black leading-tight text-white">Auto Term AI</h1>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Vehicle Cockpit</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl border border-white/10 p-2 text-slate-400 lg:hidden" aria-label="Close navigation">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      </div>

      <nav className="flex-1 space-y-2 px-4 pb-6">
        {navItems.map((item, index) => (
          <motion.div key={item.to} variants={itemVariants}>
            <NavLink
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center space-x-3 rounded-2xl px-4 py-3 text-sm font-black transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-300 text-slate-950 shadow-[0_0_28px_rgba(34,211,238,.28)]'
                    : 'text-slate-300 hover:bg-cyan-300/10 hover:text-cyan-100 hover:shadow-sm'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-slate-950' : 'text-cyan-300 group-hover:text-cyan-100'
                    }`}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      className="ml-auto h-2 w-2 rounded-full bg-slate-950"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      <motion.div
        className="px-6 pb-6 pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-center space-x-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300">
            <TrendingUp className="h-4 w-4 text-slate-950" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-black text-white">
              {user ? `Welcome, ${user.username}` : 'Not signed in'}
            </p>
            <p className="text-xs font-medium text-slate-400">Automotive Control Center</p>
          </div>
        </div>
      </motion.div>
    </motion.aside>
  );
}
