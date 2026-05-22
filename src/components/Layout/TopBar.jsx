import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const titles = {
  '/dashboard': 'Dashboard',
  '/account': 'Account',
  '/transactions': 'Transactions',
  '/billing': 'Billing',
  '/trunks': 'Trunks',
  '/rates': 'Rates',
  '/dids': 'DIDs',
};

export default function TopBar({ onMenuClick }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const title = titles[pathname] ?? 'Client Portal';
  const displayName =
    user?.displayName ?? user?.email_or_name ?? user?.username ?? 'Client';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 shadow-sm md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700 sm:flex">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span className="hidden text-sm text-slate-600 sm:inline">{displayName}</span>
      </div>
    </header>
  );
}
