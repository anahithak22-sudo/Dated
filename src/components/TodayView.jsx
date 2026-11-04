import { useState } from 'react'
import PlaceCard from './PlaceCard.jsx'
import StarRating from './StarRating.jsx'
import { dayKeyOf, formatDay, generateCombo, placesById, todayISO } from '../lib/places.js'

const missing = (id, type) => ({
  id, type, name: 'Место удалено из списка', description: '', address: '—', hours: null, link: '',
})

function PendingDate({ date, onRate, onCancel, busy }) {
  const [food, setFood] = useState(0)
  const [fun, setFun] = useState(0)
  const dayKey = dayKeyOf(date.day)
  const items = [
    { place: placesById[date.food_id] ?? missing(date.food_id, 'food'), value: food, set: setFood },
    { place: placesById[date.fun_id] ?? missing(date.fun_id, 'fun'), value: fun, set: setFun },
  ]

  return (
    <section className="today">
      <div className="hero">
        <p className="kicker">Ваше свидание</p>
        <h2>{formatDay(date.day)}</h2>
        <p className="sub">Как всё прошло? Оцените каждое место — потом они переедут в архив.</p>
      </div>

      <div className="combo">
        {items.map(({ place, value, set }) => (
          <div key={place.id} className="rated-slot">
            <PlaceCard place={place} dayKey={dayKey} />
            <div className="rate-box">
              <span>Ваша оценка</span>
              <StarRating value={value} onChange={set} size="lg" label={`Оценка: ${place.name}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="actions">
        <button
          className="btn btn-primary"
          disabled={busy || !food || !fun}
          onClick={() => onRate(date, food, fun)}
        >
          ✦ Сохранить отзыв
        </button>
        <button
          className="btn btn-link"
          disabled={busy}
          onClick={() => window.confirm('Отменить это свидание? Места останутся в списке.') && onCancel(date)}
        >
          Отменить свидание
        </button>
      </div>
    </section>
  )
}

function Generator({ archived, onAccept, busy }) {
  const [day, setDay] = useState(todayISO())
  const [combo, setCombo] = useState(null)
  const dayKey = dayKeyOf(day)

  const generate = () => setCombo(generateCombo(archived, dayKey, combo))
  const ready = combo?.food && combo?.fun

  return (
    <section className="today">
      <div className="hero">
        <p className="kicker">Свидание на</p>
        <label className="date-pick">
          <input
            type="date"
            value={day}
            min={todayISO()}
            onChange={(e) => {
              if (!e.target.value) return
              setDay(e.target.value)
              setCombo(null)
            }}
          />
          <span>{formatDay(day)}</span>
        </label>
        {!combo && (
          <button className="btn btn-primary btn-big" onClick={generate}>
            ✦ Сгенерировать наш день
          </button>
        )}
      </div>

      {combo && (
        <>
          <div className="combo">
            {combo.food ? (
              <PlaceCard place={combo.food} dayKey={dayKey} />
            ) : (
              <div className="card empty">Нет открытых мест, где покушать, в этот день ☁︎</div>
            )}
            <div className="plus" aria-hidden="true">✦</div>
            {combo.fun ? (
              <PlaceCard place={combo.fun} dayKey={dayKey} />
            ) : (
              <div className="card empty">Нет открытых развлечений в этот день ☁︎</div>
            )}
          </div>
          <div className="actions">
            <button
              className="btn btn-primary"
              disabled={busy || !ready}
              onClick={() => onAccept({ day, food_id: combo.food.id, fun_id: combo.fun.id })}
            >
              Принимаем ♡
            </button>
            <button className="btn btn-soft" disabled={busy} onClick={generate}>
              ↻ Другой вариант
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export default function TodayView({ state, busy, onAccept, onRate, onCancel }) {
  const pending = state.dates.find((d) => d.status === 'pending')
  return pending ? (
    <PendingDate key={pending.id} date={pending} onRate={onRate} onCancel={onCancel} busy={busy} />
  ) : (
    <Generator archived={state.archived} onAccept={onAccept} busy={busy} />
  )
}
