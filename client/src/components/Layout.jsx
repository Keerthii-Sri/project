import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/fleet', label: 'Fleet' },
  { to: '/locations', label: 'Locations' },
  { to: '/optimize', label: 'Optimize' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/settings', label: 'Settings' },
];

export default function Layout() {
  const navigate = useNavigate();
  const signOut = useAuthStore((state) => state.signOut);

  const handleSignOut = () => {
    localStorage.removeItem('greenfleet-demo-session');
    signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-emerald-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="text-xl font-black">🌿 GreenFleet AI</div>
          <nav className="hidden gap-5 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-emerald-300' : 'text-slate-200'}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button className="btn-secondary border-white bg-transparent text-white hover:bg-emerald-800" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
