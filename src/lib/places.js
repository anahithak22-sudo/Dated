import placesData from '../data/places.json'

export const places = placesData
export const placesById = Object.fromEntries(places.map((p) => [p.id, p]))

// JS getDay(): 0 = воскресенье
export const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
export const WEEK_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
export const DAY_SHORT = { mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс' }

export const TYPE_LABEL = { food: 'Покушать', fun: 'Развлечение' }

export function parseDay(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function dayKeyOf(iso) {
  return DAY_KEYS[parseDay(iso).getDay()]
}

export function formatDay(iso, withWeekday = true) {
  return parseDay(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    ...(withWeekday ? { weekday: 'long' } : {}),
  })
}

// Нет данных о часах — считаем, что открыто (лучше предложить, чем потерять)
export function isOpenOn(place, dayKey) {
  if (!place.hours) return true
  return place.hours[dayKey] !== null && place.hours[dayKey] !== undefined
}

export function hoursOn(place, dayKey) {
  if (!place.hours) return 'часы уточнить'
  return place.hours[dayKey] ?? 'выходной'
}

const amd = (n) => n.toLocaleString('ru-RU').replace(/\s/g, ' ')

export function formatPrice(place) {
  const { priceMin, priceMax, priceNote } = place
  if (priceMin == null && priceMax == null) return 'цена не указана'
  const range =
    priceMin != null && priceMax != null && priceMin !== priceMax
      ? `${amd(priceMin)}–${amd(priceMax)}`
      : amd(priceMin ?? priceMax)
  return `≈ ${range} ֏${priceNote ? ` ${priceNote}` : ''}`
}

export function linkLabel(url) {
  if (!url) return null
  if (/instagram\.com/i.test(url)) return 'Instagram'
  if (/tiktok\.com/i.test(url)) return 'TikTok'
  if (/facebook\.com|fb\.com/i.test(url)) return 'Facebook'
  if (/t\.me/i.test(url)) return 'Telegram'
  return 'Сайт'
}

export function mapsUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

function pickRandom(list, avoidId) {
  if (list.length === 0) return null
  const pool = list.length > 1 && avoidId ? list.filter((p) => p.id !== avoidId) : list
  return pool[Math.floor(Math.random() * pool.length)]
}

export function availablePlaces(type, archived, dayKey) {
  return places.filter((p) => p.type === type && !archived[p.id] && isOpenOn(p, dayKey))
}

// «Другой вариант» меняет оба места, по возможности не повторяя предыдущие
export function generateCombo(archived, dayKey, previous) {
  const food = pickRandom(availablePlaces('food', archived, dayKey), previous?.food?.id)
  const fun = pickRandom(availablePlaces('fun', archived, dayKey), previous?.fun?.id)
  return { food, fun }
}

// История посещений места: [{ day, stars }]
export function historyFor(placeId, dates) {
  return dates
    .filter((d) => d.status === 'rated' && (d.food_id === placeId || d.fun_id === placeId))
    .map((d) => ({ day: d.day, stars: d.food_id === placeId ? d.food_rating : d.fun_rating }))
    .sort((a, b) => b.day.localeCompare(a.day))
}
