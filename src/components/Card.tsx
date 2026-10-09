import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function Card({
  className = '',
  tape,
  children,
  as: Tag = 'section',
  ...rest
}: {
  className?: string;
  /** Washi-tape colour class, e.g. "bg-peach". */
  tape?: string;
  children: ReactNode;
  as?: 'section' | 'div' | 'header';
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={`card ${className}`} {...rest}>
      {tape && <span aria-hidden className={`tape ${tape}`} />}
      {children}
    </Tag>
  );
}

export function CardTitle({
  icon: Icon,
  iconClass = 'text-sage-deep',
  children,
  right,
  sub,
}: {
  icon: LucideIcon;
  iconClass?: string;
  children: ReactNode;
  right?: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <Icon aria-hidden className={`size-[18px] shrink-0 ${iconClass}`} strokeWidth={2.4} />
        <h2 className="truncate text-[15px] font-extrabold tracking-tight">{children}</h2>
        {sub && <span className="truncate text-xs font-semibold text-muted">{sub}</span>}
      </div>
      {right}
    </div>
  );
}

/** A tiny hand-drawn style sparkle for decoration. */
export function Sparkle({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2c.5 4.6 2.4 7.4 7.5 8.2.6.1.6.9 0 1-5.1.8-7 3.6-7.5 8.3-.1.6-.9.6-1 0-.5-4.7-2.4-7.5-7.5-8.3-.6-.1-.6-.9 0-1C8.6 9.4 10.5 6.6 11 2c.1-.6.9-.6 1 0Z" />
    </svg>
  );
}
