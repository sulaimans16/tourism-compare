import { LogIn, LogOut, Monitor, Moon, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Button } from './ui';

/** Wordmark: a gopuram silhouette drawn as stacked tiers. */
function Mark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-accent" aria-hidden>
      <path fill="currentColor" d="M10 2h4v2h-4zM8 5h8v3H8zM6.5 9h11v4h-11zM5 14h14v5H5zM3 20h18v2H3z" />
      <path fill="rgb(var(--surface))" d="M10.5 16h3v3h-3z" />
    </svg>
  );
}

const nav = ({ isActive }: { isActive: boolean }) =>
  cn('rounded-md px-3 py-1.5 text-[15px] font-semibold transition-colors', isActive ? 'text-accent' : 'text-muted hover:text-ink');

export function Layout({ children }: { children: ReactNode }) {
  const { session, signOut } = useAuth();
  const theme = useTheme();
  const ThemeIcon = theme.choice === 'dark' ? Moon : theme.choice === 'light' ? Sun : Monitor;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="no-print sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap">
            <Mark />
            <span className="font-display text-lg font-extrabold tracking-tight">Yatra Compare</span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={(a) => cn(nav(a), 'hidden sm:block')}>
              Explore
            </NavLink>
            {session && (
              <NavLink to="/trips" className={nav}>
                My trips
              </NavLink>
            )}
            <Button variant="ghost" size="sm" onClick={theme.next} aria-label={`Theme: ${theme.choice}. Click to change.`} title={`Theme: ${theme.choice}`}>
              <ThemeIcon className="h-4 w-4" />
            </Button>
            {session ? (
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
              </Button>
            ) : (
              <Link to="/login">
                <Button size="sm">
                  <LogIn className="h-4 w-4" /> Sign in
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="no-print border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-2 px-4 py-6 text-sm text-muted sm:grid-cols-[1fr_auto] sm:px-6">
          <p className="max-w-2xl">
            Prices come live from booking sites through Google Hotels and can change at checkout. We don't take bookings or
            payments; you book directly with the site or agency you pick.
          </p>
          <p className="eyebrow self-end">Places & agencies © Google</p>
        </div>
      </footer>
    </div>
  );
}
