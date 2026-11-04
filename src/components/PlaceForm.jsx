import { useEffect, useState } from 'react'
import { DAY_SHORT, WEEK_ORDER } from '../lib/places.js'

const emptyWeek = () => Object.fromEntries(WEEK_ORDER.map((k) => [k, '']))
const noneClosed = () => Object.fromEntries(WEEK_ORDER.map((k) => [k, false]))
const UNKNOWN = 'часы уточнить'

function initialState(place) {
  const hours = emptyWeek()
  const closed = noneClosed()
  if (place?.hours) {
    for (const k of WEEK_ORDER) {
      if (place.hours[k] == null) closed[k] = true
      else if (place.hours[k] !== UNKNOWN) hours[k] = place.hours[k]
    }
  }
  return {
    type: place?.type ?? 'food',
    name: place?.name ?? '',
    description: place?.description ?? '',
    address: place?.address ?? '',
    link: place?.link ?? '',
    priceMin: place?.priceMin ?? '',
    priceMax: place?.priceMax ?? '',
    priceNote: place?.priceNote ?? 'на двоих',
    hoursKnown: Boolean(place?.hours),
    everyDay: '',
    hours,
    closed,
  }
}

const toNumber = (v) => {
  const n = Number(String(v).replace(/[^\d]/g, ''))
  return String(v).trim() && Number.isFinite(n) && n > 0 ? n : null
}

// «instagram.com/x» → «https://instagram.com/x», «@name» → ссылка на Instagram
function normalizeLink(raw) {
  const v = raw.trim()
  if (!v) return ''
  if (/^@[\w.]+$/.test(v)) return `https://www.instagram.com/${v.slice(1)}/`
  return /^https?:\/\//i.test(v) ? v : `https://${v}`
}

function toPlace(f) {
  const priceMin = toNumber(f.priceMin)
  const priceMax = toNumber(f.priceMax)
  const place = {
    type: f.type,
    name: f.name.trim(),
    description: f.description.trim(),
    address: f.address.trim(),
    hours: f.hoursKnown
      ? Object.fromEntries(WEEK_ORDER.map((k) => [k, f.closed[k] ? null : f.hours[k].trim() || UNKNOWN]))
      : null,
    priceMin: priceMin ?? priceMax,
    priceMax: priceMax ?? priceMin,
    link: normalizeLink(f.link),
    source: '',
  }
  if ((priceMin ?? priceMax) != null && f.priceNote.trim()) place.priceNote = f.priceNote.trim()
  return place
}

export default function PlaceForm({ place, busy, onSave, onDelete, onClose, deleteDisabled }) {
  const [f, setF] = useState(() => initialState(place))
  const [error, setError] = useState(null)
  const set = (patch) => setF((s) => ({ ...s, ...patch }))
  const editing = Boolean(place)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const submit = (e) => {
    e.preventDefault()
    if (!f.name.trim() || !f.address.trim()) {
      setError('Заполните название и адрес')
      return
    }
    onSave(toPlace(f))
  }

  const applyEveryDay = () => {
    if (!f.everyDay.trim()) return
    set({
      hours: Object.fromEntries(WEEK_ORDER.map((k) => [k, f.everyDay.trim()])),
      closed: noneClosed(),
    })
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal card" onSubmit={submit} aria-label={editing ? 'Изменить место' : 'Новое место'}>
        <div className="modal-head">
          <h2>{editing ? 'Изменить место' : 'Новое место'} ✦</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        <div className="seg" role="radiogroup" aria-label="Тип">
          {[['food', 'Покушать'], ['fun', 'Развлечение']].map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={f.type === v}
              className={f.type === v ? 'on' : ''}
              onClick={() => set({ type: v })}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="field">
          <span>Название *</span>
          <input value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="Например, Kagayaki" autoFocus={!editing} />
        </label>

        <label className="field">
          <span>Короткое описание</span>
          <textarea rows={2} value={f.description} onChange={(e) => set({ description: e.target.value })} placeholder="Чем хорошо это место" />
        </label>

        <label className="field">
          <span>Адрес *</span>
          <input value={f.address} onChange={(e) => set({ address: e.target.value })} placeholder="ул. Сарьяна, 8, Ереван" />
        </label>

        <label className="field">
          <span>Ссылка на страницу</span>
          <input inputMode="url" autoCapitalize="none" value={f.link} onChange={(e) => set({ link: e.target.value })} placeholder="Instagram, TikTok, сайт или @ник" />
        </label>

        <fieldset className="field">
          <span>Примерная цена, ֏</span>
          <div className="row">
            <input inputMode="numeric" value={f.priceMin} onChange={(e) => set({ priceMin: e.target.value })} placeholder="от" />
            <span className="dash">–</span>
            <input inputMode="numeric" value={f.priceMax} onChange={(e) => set({ priceMax: e.target.value })} placeholder="до" />
          </div>
          <input value={f.priceNote} onChange={(e) => set({ priceNote: e.target.value })} placeholder="на двоих, за билет…" />
        </fieldset>

        <fieldset className="field">
          <label className="check">
            <input type="checkbox" checked={f.hoursKnown} onChange={(e) => set({ hoursKnown: e.target.checked })} />
            <span>Знаю часы работы</span>
          </label>
          {!f.hoursKnown && <p className="hint">Без часов место предлагается в любой день, на карточке будет «часы уточнить».</p>}
          {f.hoursKnown && (
            <>
              <div className="row">
                <input value={f.everyDay} onChange={(e) => set({ everyDay: e.target.value })} placeholder="10:00–22:00" />
                <button type="button" className="btn btn-soft btn-sm" onClick={applyEveryDay}>Каждый день</button>
              </div>
              <div className="week">
                {WEEK_ORDER.map((k) => (
                  <div key={k} className={`day-row ${f.closed[k] ? 'is-closed' : ''}`}>
                    <span className="day">{DAY_SHORT[k]}</span>
                    <input
                      value={f.closed[k] ? '' : f.hours[k]}
                      disabled={f.closed[k]}
                      onChange={(e) => set({ hours: { ...f.hours, [k]: e.target.value } })}
                      placeholder={f.closed[k] ? 'выходной' : '10:00–22:00'}
                      aria-label={`Часы, ${DAY_SHORT[k]}`}
                    />
                    <label className="check small">
                      <input
                        type="checkbox"
                        checked={f.closed[k]}
                        onChange={(e) => set({ closed: { ...f.closed, [k]: e.target.checked } })}
                      />
                      <span>выходной</span>
                    </label>
                  </div>
                ))}
              </div>
            </>
          )}
        </fieldset>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {editing ? 'Сохранить' : '✦ Добавить место'}
          </button>
          {editing && onDelete && (
            <button
              type="button"
              className="btn btn-link"
              disabled={busy || deleteDisabled}
              title={deleteDisabled ? 'Это место в текущем свидании' : undefined}
              onClick={() => window.confirm(`Удалить «${place.name}»? Историю свиданий это не затронет.`) && onDelete()}
            >
              Удалить место
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
