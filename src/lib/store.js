// Общее состояние: места, добавленные через сайт, архив мест и свидания с оценками.
// Если заданы VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY — всё хранится в Supabase
// (общее для обоих телефонов). Иначе — в localStorage этого браузера (для разработки).
import { createClient } from '@supabase/supabase-js'

// Берём только https://xxxx.supabase.co — без /rest/v1/, слешей и пробелов,
// даже если в переменную вставили адрес с лишним путём
function projectOrigin(raw) {
  const value = raw?.trim()
  if (!value) return null
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).origin
  } catch {
    return value
  }
}

const url = projectOrigin(import.meta.env.VITE_SUPABASE_URL)
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const isShared = Boolean(url && key)
const supabase = isShared ? createClient(url, key) : null

function check({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

const remote = {
  async load() {
    const [states, dates] = await Promise.all([
      supabase.from('place_state').select('place_id, archived').then(check),
      supabase.from('dates').select('*').order('day', { ascending: false }).then(check),
    ])
    const archived = {}
    for (const s of states) if (s.archived) archived[s.place_id] = true
    // Таблицы custom_places может ещё не быть — тогда остальное всё равно работает
    const res = await supabase.from('custom_places').select('id, data').order('created_at')
    const customReady = !res.error
    const rows = customReady ? res.data : []
    // Строка с data.deleted — пометка «встроенное место удалено»
    const hidden = rows.filter((r) => r.data?.deleted).map((r) => r.id)
    const custom = rows.filter((r) => !r.data?.deleted).map((r) => ({ ...r.data, id: r.id, custom: true }))
    return { archived, dates, custom, hidden, customReady }
  },
  async hideBuiltIn(id) {
    check(await supabase.from('custom_places').upsert({ id, data: { deleted: true } }))
  },
  async addPlace(place) {
    const { id, custom, ...data } = place
    check(await supabase.from('custom_places').insert({ id: newPlaceId(), data }))
  },
  async updatePlace(id, place) {
    const { id: _id, custom, ...data } = place
    check(await supabase.from('custom_places').update({ data }).eq('id', id))
  },
  async deletePlace(id) {
    check(await supabase.from('custom_places').delete().eq('id', id))
  },
  async setArchived(ids, value) {
    const rows = ids.map((place_id) => ({ place_id, archived: value, updated_at: new Date().toISOString() }))
    check(await supabase.from('place_state').upsert(rows))
  },
  async acceptDate({ day, food_id, fun_id }) {
    check(await supabase.from('dates').insert({ day, food_id, fun_id }))
  },
  async cancelDate(id) {
    check(await supabase.from('dates').delete().eq('id', id))
  },
  async rateDate(id, food_rating, fun_rating) {
    check(
      await supabase
        .from('dates')
        .update({ status: 'rated', food_rating, fun_rating, rated_at: new Date().toISOString() })
        .eq('id', id),
    )
  },
}

function newPlaceId() {
  return `u-${crypto.randomUUID().slice(0, 8)}`
}

const LS_KEY = 'dated-state-v1'
function readLocal() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY)) ?? {}
    return { archived: s.archived ?? {}, dates: s.dates ?? [], custom: s.custom ?? [], hidden: s.hidden ?? [] }
  } catch {
    return { archived: {}, dates: [], custom: [], hidden: [] }
  }
}
function writeLocal(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch {
    /* приватный режим и т.п. */
  }
}

const local = {
  async load() {
    const s = readLocal()
    s.dates.sort((a, b) => b.day.localeCompare(a.day))
    return { ...s, custom: s.custom.map((p) => ({ ...p, custom: true })), customReady: true }
  },
  async hideBuiltIn(id) {
    const s = readLocal()
    if (!s.hidden.includes(id)) s.hidden.push(id)
    writeLocal(s)
  },
  async addPlace(place) {
    const s = readLocal()
    const { custom, ...data } = place
    s.custom.push({ ...data, id: newPlaceId() })
    writeLocal(s)
  },
  async updatePlace(id, place) {
    const s = readLocal()
    const { custom, ...data } = place
    s.custom = s.custom.map((p) => (p.id === id ? { ...data, id } : p))
    writeLocal(s)
  },
  async deletePlace(id) {
    const s = readLocal()
    s.custom = s.custom.filter((p) => p.id !== id)
    writeLocal(s)
  },
  async setArchived(ids, value) {
    const s = readLocal()
    for (const id of ids) {
      if (value) s.archived[id] = true
      else delete s.archived[id]
    }
    writeLocal(s)
  },
  async acceptDate({ day, food_id, fun_id }) {
    const s = readLocal()
    s.dates.push({
      id: crypto.randomUUID(), day, food_id, fun_id, status: 'pending',
      food_rating: null, fun_rating: null, created_at: new Date().toISOString(), rated_at: null,
    })
    writeLocal(s)
  },
  async cancelDate(id) {
    const s = readLocal()
    s.dates = s.dates.filter((d) => d.id !== id)
    writeLocal(s)
  },
  async rateDate(id, food_rating, fun_rating) {
    const s = readLocal()
    const d = s.dates.find((x) => x.id === id)
    if (d) Object.assign(d, { status: 'rated', food_rating, fun_rating, rated_at: new Date().toISOString() })
    writeLocal(s)
  },
}

export const store = isShared ? remote : local
