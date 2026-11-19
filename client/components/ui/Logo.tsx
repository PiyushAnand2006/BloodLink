export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      {/* Blood drop */}
      <path
        d="M24 4C24 4 10 20 10 29.5 10 37.5 16 42 24 42s14-4.5 14-12.5C38 20 24 4 24 4Z"
        fill="#C62828"
      />
      <path
        d="M24 4C24 4 17.5 12 15 21.5c3.5 2 9 2 13.5-.5C30 13.5 24 4 24 4Z"
        fill="#E53935"
      />
      {/* Cross */}
      <rect x="21.6" y="24" width="4.8" height="12" rx="1" fill="#FFFFFF" />
      <rect x="18" y="27.6" width="12" height="4.8" rx="1" fill="#FFFFFF" />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="text-lg font-bold tracking-tight text-navy">BloodLink</span>
      {!compact && (
        <span className="hidden text-2xs font-semibold uppercase tracking-widest text-muted sm:inline">
          Emergency Blood Coordination
        </span>
      )}
    </span>
  );
}
