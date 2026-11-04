import { useCallback, useEffect, useMemo, useState } from 'react'
import StarField from './components/StarField.jsx'
import TodayView from './components/TodayView.jsx'
import PlacesView from './components/PlacesView.jsx'
import { isShared, store } from './lib/store.js'
import { builtInPlaces } from './lib/places.js'

const TABS = [
  { id: 'today', label: 'Наш день' },
  { id: 'places', label: 'Места' },
  { id: 'archive', label: 'Архив' },
]

export default function App() {
  const [tab, setTab] = useState('today')
  const [state, setState] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      setState(await store.load())
      setError(null)
    } catch (e) {
      setError(`Не удалось загрузить данные: ${e.message}`)
    }
  }, [])

  useEffect(() => {
    refresh()
    // Подтягиваем изменения, сделанные со второго телефона
    const onVisible = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  // Возвращает true, если действие прошло успешно (форма по нему закрывается)
  const run = (fn) => async (...args) => {
    setBusy(true)
    try {
      await fn(...args)
      await refresh()
      return true
    } catch (e) {
      setError(`Не получилось сохранить: ${e.message}`)
      return false
    } finally {
      setBusy(false)
    }
  }

  const actions = {
    onAccept: run((d) => store.acceptDate(d)),
    onCancel: run((d) => store.cancelDate(d.id)),
    onRate: run(async (d, food, fun) => {
      await store.rateDate(d.id, food, fun)
      await store.setArchived([d.food_id, d.fun_id], true)
    }),
    onArchive: run((id, value) => store.setArchived([id], value)),
    onAddPlace: run((place) => store.addPlace(place)),
    onUpdatePlace: run((id, place) => store.updatePlace(id, place)),
    onDeletePlace: run((id) => store.deletePlace(id)),
  }

  const places = useMemo(() => [...builtInPlaces, ...(state?.custom ?? [])], [state])
  const archivedCount = state ? places.filter((p) => state.archived[p.id]).length : 0

  return (
    <>
      <StarField />
      <div className="app">
        <header className="top">
          <h1>
            Наш день <span className="spark">✦</span>
          </h1>
          <p className="tagline">маленькие свидания в Ереване</p>
        </header>

        <nav className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? 'active' : ''}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === 'archive' && archivedCount > 0 && <span className="badge">{archivedCount}</span>}
            </button>
          ))}
        </nav>

        {!isShared && (
          <div className="notice">
            Локальный режим: данные хранятся только в этом браузере. Подключите Supabase, чтобы делиться между телефонами.
          </div>
        )}
        {error && (
          <div className="notice error" role="alert">
            {error} <button className="btn-link" onClick={refresh}>Повторить</button>
          </div>
        )}

        <main>
          {!state ? (
            <div className="loading">✦</div>
          ) : tab === 'today' ? (
            <TodayView state={state} places={places} busy={busy} {...actions} />
          ) : (
            <PlacesView
              mode={tab === 'archive' ? 'archive' : 'active'}
              places={places}
              state={state}
              busy={busy}
              onArchive={actions.onArchive}
              onAddPlace={actions.onAddPlace}
              onUpdatePlace={actions.onUpdatePlace}
              onDeletePlace={actions.onDeletePlace}
            />
          )}
        </main>

        <footer className="foot">✦ сделано с любовью ✦</footer>
      </div>
    </>
  )
}
