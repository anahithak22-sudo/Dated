import PlaceCard from './PlaceCard.jsx'
import { DAY_KEYS, historyFor, places } from '../lib/places.js'

const SECTIONS = [
  { type: 'food', title: 'Покушать' },
  { type: 'fun', title: 'Развлечения' },
]

export default function PlacesView({ mode, state, busy, onArchive }) {
  const inArchive = mode === 'archive'
  const todayKey = DAY_KEYS[new Date().getDay()]
  const pending = state.dates.find((d) => d.status === 'pending')
  const pendingIds = pending ? [pending.food_id, pending.fun_id] : []
  const list = places.filter((p) => Boolean(state.archived[p.id]) === inArchive)

  if (list.length === 0) {
    return (
      <div className="card empty big">
        {inArchive
          ? 'Архив пока пуст. Сюда попадут места после свиданий ✦'
          : 'Все места в архиве. Верните что-нибудь или пришлите новые ссылки ✦'}
      </div>
    )
  }

  return (
    <div className="places">
      {SECTIONS.map(({ type, title }) => {
        const items = list.filter((p) => p.type === type)
        if (items.length === 0) return null
        return (
          <section key={type}>
            <h2 className="section-title">
              {title} <span className="count">{items.length}</span>
            </h2>
            <div className="grid">
              {items.map((p) => (
                <PlaceCard key={p.id} place={p} dayKey={todayKey} history={historyFor(p.id, state.dates)} showType={false}>
                  {inArchive ? (
                    <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => onArchive(p.id, false)}>
                      ↺ Вернуть
                    </button>
                  ) : (
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={busy || pendingIds.includes(p.id)}
                      title={pendingIds.includes(p.id) ? 'Это место в текущем свидании' : undefined}
                      onClick={() => onArchive(p.id, true)}
                    >
                      В архив
                    </button>
                  )}
                </PlaceCard>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
