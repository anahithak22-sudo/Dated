import StarRating from './StarRating.jsx'
import {
  DAY_SHORT, TYPE_LABEL, WEEK_ORDER, formatDay, formatPrice, hoursOn, linkLabel, mapsUrl,
} from '../lib/places.js'

export default function PlaceCard({ place, dayKey, history = [], showType = true, children }) {
  const label = linkLabel(place.link)
  const avg = history.length ? history.reduce((s, h) => s + h.stars, 0) / history.length : null

  return (
    <article className={`card place type-${place.type}`}>
      {showType && <div className="eyebrow">✦ {TYPE_LABEL[place.type]}</div>}
      <h3>{place.name}</h3>
      {place.description && <p className="desc">{place.description}</p>}

      <ul className="facts">
        <li>
          <span className="ico" aria-hidden="true">⌖</span>
          <a href={mapsUrl(place.address)} target="_blank" rel="noreferrer">{place.address}</a>
        </li>
        <li>
          <span className="ico" aria-hidden="true">◷</span>
          <details className="hours">
            <summary>
              {dayKey ? `${DAY_SHORT[dayKey]}: ${hoursOn(place, dayKey)}` : 'Часы работы'}
            </summary>
            <table>
              <tbody>
                {WEEK_ORDER.map((k) => (
                  <tr key={k} className={k === dayKey ? 'current' : ''}>
                    <th>{DAY_SHORT[k]}</th>
                    <td>{hoursOn(place, k)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </li>
        <li>
          <span className="ico" aria-hidden="true">֏</span>
          {formatPrice(place)}
        </li>
      </ul>

      {history.length > 0 && (
        <div className="history">
          <div className="history-title">
            Были {history.length} {history.length === 1 ? 'раз' : 'раза'} · в среднем {avg.toFixed(1)} ★
          </div>
          <ul>
            {history.map((h, i) => (
              <li key={i}>
                <span>{formatDay(h.day, false)}</span>
                <StarRating value={h.stars} size="sm" />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card-actions">
        {label && (
          <a className="btn btn-soft" href={place.link} target="_blank" rel="noreferrer">
            {label} ↗
          </a>
        )}
        {children}
      </div>
    </article>
  )
}
