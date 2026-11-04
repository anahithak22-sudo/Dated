import { useMemo } from 'react'

// Детерминированный «случайный» генератор, чтобы звёзды не прыгали между рендерами
function rng(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

export default function StarField() {
  const stars = useMemo(() => {
    const r = rng(42)
    return Array.from({ length: 34 }, (_, i) => ({
      id: i,
      left: r() * 100,
      top: r() * 100,
      size: 6 + r() * 14,
      delay: r() * 6,
      duration: 3 + r() * 4,
      tone: i % 3,
    }))
  }, [])

  return (
    <div className="starfield" aria-hidden="true">
      {stars.map((s) => (
        <svg
          key={s.id}
          className={`twinkle tone-${s.tone}`}
          viewBox="0 0 32 32"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        >
          <path d="M16 1c1.2 8.6 6.4 13.8 15 15-8.6 1.2-13.8 6.4-15 15-1.2-8.6-6.4-13.8-15-15C9.6 14.8 14.8 9.6 16 1z" />
        </svg>
      ))}
    </div>
  )
}
