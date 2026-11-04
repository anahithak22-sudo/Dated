// Общее состояние: архив мест и свидания с оценками.
// Если заданы VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY — всё хранится в Supabase
// (общее для обоих телефонов). Иначе — в localStorage этого браузера (для разработки).
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

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
    return { archived, dates }
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

const LS_KEY = 'dated-state-v1'
function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) ?? { archived: {}, dates: [] }
  } catch {
    return { archived: {}, dates: [] }
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
    return s
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
