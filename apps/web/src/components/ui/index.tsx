import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
const variants: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: 'bg-stone-900 text-white hover:bg-stone-700',
  outline: 'border border-stone-300 bg-white hover:bg-stone-100',
  ghost: 'hover:bg-stone-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md'; loading?: boolean }
>(({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
  <button
    ref={ref}
    disabled={disabled || loading}
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
      size === 'sm' ? 'h-8 px-3 text-sm' : 'h-10 px-4',
      variants[variant],
      className,
    )}
    {...props}
  >
    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
    {children}
  </button>
));
Button.displayName = 'Button';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn('h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100', className)}
    {...props}
  />
));
Input.displayName = 'Input';

export const Select = ({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={cn('h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-brand-500', className)}
    {...props}
  />
);

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('rounded-xl border border-stone-200 bg-white shadow-sm', className)} {...props} />
);

export const Badge = ({ className, tone = 'default', ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: 'default' | 'green' | 'orange' | 'blue' }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
      { default: 'bg-stone-100 text-stone-700', green: 'bg-green-100 text-green-800', orange: 'bg-brand-100 text-brand-700', blue: 'bg-sky-100 text-sky-800' }[tone],
      className,
    )}
    {...props}
  />
);

export const Label = ({ className, ...props }: HTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500', className)} {...props} />
);

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 p-6 text-stone-500">
      <Loader2 className="h-5 w-5 animate-spin" /> {label ?? 'Loading…'}
    </div>
  );
}

export function ErrorNote({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <span>{children}</span>
      {onRetry && <Button size="sm" variant="outline" onClick={onRetry}>Retry</Button>}
    </div>
  );
}

/** Right-side drawer (shadcn "Sheet" style). */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { id: T; label: ReactNode }[] }) {
  return (
    <div className="no-print flex gap-1 rounded-lg bg-stone-100 p-1" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn('rounded-md px-4 py-1.5 text-sm font-medium', value === t.id ? 'bg-white shadow-sm' : 'text-stone-600 hover:text-stone-900')}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
