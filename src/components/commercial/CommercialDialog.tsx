import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function CommercialIcon({ name, className = '' }: { name: 'plus' | 'edit' | 'check' | 'arrow' | 'close' | 'copy' | 'grid' | 'compare' | 'chevron' | 'users' | 'building'; className?: string }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" />,
    edit: <><path d="m16 3 5 5-12 12-6 1 1-6L16 3Z" /><path d="m13 6 5 5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    copy: <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    compare: <><path d="M8 3v18m8-18v18M3 8l5-5 5 5m-2 8 5 5 5-5" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v3" /></>,
    building: <><path d="M4 21V3h16v18M9 21v-4h6v4M8 7h1m6 0h1M8 11h1m6 0h1" /></>
  };
  return <svg className={`commercial-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function CommercialDialog({ titleId, onClose, children, className = '' }: { titleId: string; onClose: () => void; children: ReactNode; className?: string }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('summary, button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') || []).filter(node => node.getClientRects().length > 0 && node.checkVisibility());
    const frame = requestAnimationFrame(() => (dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]') || focusable()[0] || dialogRef.current)?.focus());
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeRef.current(); }
      if (event.key === 'Tab') {
        const nodes = focusable(); const first = nodes[0]; const last = nodes.at(-1);
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keydown, true);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('keydown', keydown, true); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return createPortal(<div className="commercial-overlay" onMouseDown={event => { if (event.target === event.currentTarget) closeRef.current(); }}>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={`commercial-dialog ${className}`}>{children}</div>
  </div>, document.body);
}
