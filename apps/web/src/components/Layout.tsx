import { Compass, LogIn, LogOut, Map } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from './ui';

export function Layout({ children }: { children: ReactNode }) {
  const { session, signOut } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-brand-700">
            <Compass className="h-5 w-5" /> Yatra Compare
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <NavLink to="/" className="rounded-md px-3 py-1.5 hover:bg-stone-100">Explore</NavLink>
            {session && (
              <NavLink to="/trips" className="flex items-center gap-1 rounded-md px-3 py-1.5 hover:bg-stone-100">
                <Map className="h-4 w-4" /> My trips
              </NavLink>
            )}
            {session ? (
              <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /> Sign out</Button>
            ) : (
              <Link to="/login"><Button size="sm"><LogIn className="h-4 w-4" /> Sign in</Button></Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      <footer className="no-print mx-auto max-w-7xl px-4 py-8 text-xs text-stone-500">
        Prices are fetched live from booking platforms via Google Hotels and may change at checkout. We do not take bookings
        or payments; you complete them on the provider's site. Places and agency data © Google.
      </footer>
    </div>
  );
}
