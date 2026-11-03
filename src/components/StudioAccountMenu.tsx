import { useEffect, useId, useRef, useState } from 'react';
import './studio-account.css';

export function SignOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 4H4v16h5M10 12h11m-4-4 4 4-4 4" />
    </svg>
  );
}

interface Props {
  name: string;
  email?: string;
  role: string;
  pending: boolean;
  error: string;
  onSignOut: () => Promise<void>;
}

// Shared by the v1 and v2 shells; account access never depends on a product entitlement.
export function StudioAccountMenu({ name, email, role, pending, error, onSignOut }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    actionRef.current?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return (
    <div className="studio-account" ref={rootRef} onBlur={event => {
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button
        ref={triggerRef}
        type="button"
        className="user-avatar-circle studio-account-trigger"
        title="Minha conta"
        aria-label={`Abrir opções da conta de ${name}`}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen(previous => !previous)}
      >
        {name.charAt(0)}
      </button>
      {open && (
        <section className="studio-account-panel" id={panelId} aria-label="Minha conta">
          <div className="studio-account-identity">
            <strong>{name}</strong>
            {email && <span>{email}</span>}
            <small>{role}</small>
          </div>
          <button ref={actionRef} type="button" className="studio-sign-out" disabled={pending} onClick={() => { void onSignOut(); }}>
            <SignOutIcon />{pending ? 'Saindo…' : 'Sair da conta'}
          </button>
          {error && <p className="studio-sign-out-error" role="alert">{error}</p>}
        </section>
      )}
    </div>
  );
}
