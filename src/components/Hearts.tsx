export default function Hearts({ left, total = 5 }: { left: number; total?: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${left} nyawa`}>
      {Array.from({ length: total }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          width="20"
          height="20"
          className={i < left ? 'text-sharin-glow' : 'text-edge'}
          fill="currentColor"
        >
          <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 3 4.5 6.7 4.5c2 0 3.5 1 5.3 3 1.8-2 3.3-3 5.3-3 3.7 0 5.8 3.8 4.3 7.3C19.5 16.4 12 21 12 21z" />
        </svg>
      ))}
    </div>
  )
}
