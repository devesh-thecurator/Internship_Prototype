import { NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Upload', to: '/upload' },
  { label: 'Validate', to: '/validate' },
  { label: 'Export', to: '/export' },
  { label: 'Chatbot', to: '/chatbot' },
  { label: 'Admin Panel', to: '/admin' },
];

export default function Sidebar({ user }) {
  return (
    <aside className="hidden lg:block lg:w-72 bg-white border-r border-slate-200 shadow-sm">
      <div className="p-6">
        <h1 className="text-xl font-semibold text-slate-900">Term Sheet AI</h1>
        <p className="mt-2 text-sm text-slate-500">Enterprise validation platform</p>
      </div>
      <nav className="space-y-1 px-4 pb-6">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive ? 'bg-primary text-white shadow' : 'text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 pt-4 pb-6 text-xs text-slate-500">
        {user ? `Signed in as ${user.username}` : 'Not signed in'}
      </div>
    </aside>
  );
}
