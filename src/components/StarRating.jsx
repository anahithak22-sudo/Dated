export default function StarRating({ value, onChange, size = 'md', label }) {
  const readOnly = !onChange
  return (
    <div className={`rating rating-${size}`} role={readOnly ? 'img' : 'radiogroup'} aria-label={label ?? `${value} из 5`}>
      {[1, 2, 3, 4, 5].map((n) =>
        readOnly ? (
          <span key={n} className={n <= value ? 'on' : ''}>★</span>
        ) : (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} из 5`}
            className={n <= value ? 'on' : ''}
            onClick={() => onChange(n)}
          >
            ★
          </button>
        ),
      )}
    </div>
  )
}
