import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  ArrowLeftRight,
  Receipt,
  LogOut,
  X,
  Network,
  Table2,
  Phone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/account', label: 'Account', icon: User },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/billing', label: 'Billing', icon: Receipt },
  { to: '/trunks', label: 'Trunks', icon: Network },
  { to: '/rates', label: 'Rates', icon: Table2 },
  { to: '/dids', label: 'DIDs', icon: Phone },
];

function linkClass({ isActive }) {
  return [
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
    isActive
      ? 'bg-sky-600 text-white'
      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
  ].join(' ');
}

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const displayName =
    user?.displayName ?? user?.email_or_name ?? user?.username ?? 'Client';

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-white transition-transform duration-200',
        open ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      ].join(' ')}
    >
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-sm font-bold">
            CP
          </div>
          <span className="font-semibold tracking-tight">Client Portal</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkClass} onClick={onClose}>
            <Icon size={20} aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <p className="mb-3 truncate text-xs text-slate-400">Signed in as</p>
        <p className="mb-4 truncate text-sm font-medium text-slate-200">{displayName}</p>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          <LogOut size={20} aria-hidden />
          Sign out
        </button>
      </div>
    </aside>
  );
}
