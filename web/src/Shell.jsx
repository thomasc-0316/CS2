import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Hot', to: '/hot' },
  { label: 'Tactics', to: '/tactics' },
  { label: 'Room', to: '/room', requiresAuth: true },
  { label: 'Friends', to: '/friends', requiresAuth: true },
  { label: 'Profile', to: '/profile', requiresAuth: true },
];

function NavLink({ to, label, active }) {
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
        active ? 'bg-orange-500 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
      }`}
    >
      {label}
    </Link>
  );
}

export default function Shell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const isAuthPage = location.pathname.startsWith('/login') || location.pathname.startsWith('/signup');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-[#0b0c10] text-white flex items-center justify-center px-6">
        <div className="w-full max-w-3xl bg-[#111318] border border-slate-800 rounded-2xl shadow-2xl p-8">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060a] text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-[#0c0e14]/90 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-extrabold tracking-tight text-white">
            CS2 Tactics
          </Link>
          <nav className="flex items-center gap-2">
            {navItems
              .filter((item) => (item.requiresAuth ? !!currentUser : true))
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  active={location.pathname === item.to || location.pathname.startsWith(item.to + '/')}
                />
              ))}
          </nav>
          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                <Link
                  to="/profile"
                  className="text-sm font-semibold text-white/90 hover:text-white transition-colors"
                >
                  {currentUser.profile?.username || 'Profile'}
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 text-sm font-semibold rounded-lg bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-2 text-sm font-semibold rounded-lg border border-slate-700 hover:border-slate-500"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        <section className="bg-gradient-to-r from-[#111827] via-[#0d1017] to-[#0b0c10] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </section>
      </main>
    </div>
  );
}
