import { Outlet, NavLink } from 'react-router-dom';
import { Camera, Globe, CalendarClock, LineChart, Link2 } from 'lucide-react';

export default function AppShell() {
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <aside className="p-4 border-r bg-white">
        <div className="text-2xl font-bold mb-6">Promo<span className="text-blue-600">Hub</span></div>
        <nav className="space-y-1 text-sm">
          <NavLink to="/" className={({isActive}) => `block px-3 py-2 rounded-xl ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'}`}>Dashboard</NavLink>
          <NavLink to="/studio" className={({isActive}) => `block px-3 py-2 rounded-xl ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'}`}><Camera className="inline mr-2 h-4"/>Image Studio</NavLink>
          <NavLink to="/website" className={({isActive}) => `block px-3 py-2 rounded-xl ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'}`}><Globe className="inline mr-2 h-4"/>Website</NavLink>
          <NavLink to="/scheduler" className={({isActive}) => `block px-3 py-2 rounded-xl ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'}`}><CalendarClock className="inline mr-2 h-4"/>Scheduler</NavLink>
          <NavLink to="/connections" className={({isActive}) => `block px-3 py-2 rounded-xl ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'}`}><Link2 className="inline mr-2 h-4"/>Connections</NavLink>
          <NavLink to="/analytics" className={({isActive}) => `block px-3 py-2 rounded-xl ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'}`}><LineChart className="inline mr-2 h-4"/>Analytics</NavLink>
        </nav>
      </aside>
      <main className="p-8 space-y-6">
        <Outlet />
      </main>
    </div>
  );
}
