export default function Torii({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden fill="currentColor">
      <path d="M2 14 Q60 2 118 14 L114 26 Q60 16 6 26 Z" />
      <rect x="14" y="30" width="92" height="7" />
      <rect x="22" y="26" width="10" height="74" />
      <rect x="88" y="26" width="10" height="74" />
      <rect x="54" y="18" width="12" height="14" />
    </svg>
  )
}
