import { useState } from 'react'
import PlaceCard from './PlaceCard.jsx'
import PlaceForm from './PlaceForm.jsx'
import { DAY_KEYS, historyFor } from '../lib/places.js'

const SECTIONS = [
  { type: 'food', title: 'Покушать' },
  { type: 'fun', title: 'Развлечения' },
]

export default function PlacesView({ mode, places, state, busy, onArchive, onAddPlace, onUpdatePlace, onDeletePlace }) {
  // null — форма закрыта, 'new' — новое место, объект — редактирование
  const [editing, setEditing] = useState(null)
  const inArchive = mode === 'archive'
  const todayKey = DAY_KEYS[new Date().getDay()]
  const pending = state.dates.find((d) => d.status === 'pending')
  const pendingIds = pending ? [pending.food_id, pending.fun_id] : []
  const list = places.filter((p) => Boolean(state.archived[p.id]) === inArchive)

  const close = () => setEditing(null)
  const save = async (data) => {
    const ok = editing === 'new' ? await onAddPlace(data) : await onUpdatePlace(editing.id, data)
    if (ok) close()
  }
  const remove = async () => {
    if (await onDeletePlace(editing.id)) close()
  }

  return (
    <div className="places">
      {!inArchive && (
        <div className="add-bar">
          <button className="btn btn-primary" onClick={() => setEditing('new')} disabled={!state.customReady}>
            + Добавить место
          </button>
          {!state.customReady && (
            <p className="hint">
              Чтобы добавлять места, создайте в Supabase таблицу <code>custom_places</code> (инструкция в README).
            </p>
          )}
        </div>
      )}

      {list.length === 0 && (
        <div className="card empty big">
          {inArchive
            ? 'Архив пока пуст. Сюда попадут места после свиданий ✦'
            : 'Все места в архиве. Верните что-нибудь или добавьте новое ✦'}
        </div>
      )}

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
                  {p.custom && (
                    <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setEditing(p)}>
                      ✎ Изменить
                    </button>
                  )}
                </PlaceCard>
              ))}
            </div>
          </section>
        )
      })}

      {editing && (
        <PlaceForm
          key={editing === 'new' ? 'new' : editing.id}
          place={editing === 'new' ? null : editing}
          busy={busy}
          onSave={save}
          onDelete={editing === 'new' ? null : remove}
          deleteDisabled={editing !== 'new' && pendingIds.includes(editing.id)}
          onClose={close}
        />
      )}
    </div>
  )
}
