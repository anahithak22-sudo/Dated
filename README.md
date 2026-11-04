# Наш день ✦

Генератор свиданий в Ереване: одно место покушать + одно развлечение, с учётом дня недели.
Принимаете комбинацию → после свидания ставите звёзды каждому месту → места уходят в архив
(оттуда их можно вернуть, история посещений и оценок сохраняется).

## Как устроены данные

| Что | Где |
| --- | --- |
| Места: название, описание, адрес, часы, цена, ссылка | `src/data/places.json` (в репозитории) |
| Места, добавленные через кнопку «+ Добавить место» | Supabase, таблица `custom_places` |
| Архив, свидания, оценки, история | Supabase (общее для обоих телефонов) |

Без Supabase сайт работает в «локальном режиме» — всё хранится в браузере. Удобно для разработки.

### Формат места

```json
{
  "id": "latin-slug",
  "type": "food",              // "food" — покушать, "fun" — развлечение
  "name": "Название",
  "description": "Коротко, чем хорошо",
  "address": "ул. ..., Ереван",
  "hours": { "mon": "10:00–23:00", "tue": null, "...": "..." },  // null = выходной
  "priceMin": 8000,
  "priceMax": 15000,
  "priceNote": "на двоих",
  "link": "https://instagram.com/...",
  "source": "ссылка, из которой взяты данные"
}
```

`id` не меняем после добавления — к нему привязаны архив и история.

## Добавление мест через сайт

На вкладке «Места» есть кнопка **+ Добавить место**: тип, название, описание, адрес, ссылка,
цена и часы по дням. Такие места хранятся в Supabase, видны на обоих телефонах, их можно
изменить или удалить (кнопка «✎ Изменить» на карточке).

Для этого нужна таблица `custom_places`. Если база создавалась до появления этой функции,
выполните в Supabase → SQL Editor по очереди три команды (каждую отдельно):

```sql
create table if not exists public.custom_places (id text primary key, data jsonb not null, created_at timestamptz not null default now())
```
```sql
alter table public.custom_places enable row level security
```
```sql
create policy "anon all custom_places" on public.custom_places for all to anon using (true) with check (true)
```

## Подключение Supabase (≈5 минут)

1. Зарегистрируйтесь на [supabase.com](https://supabase.com) → **New project**.
   Имя любое, регион — ближайший (например, Frankfurt), пароль базы сохраните куда-нибудь.
2. Когда проект создастся: **SQL Editor → New query**, вставьте содержимое
   [`supabase/schema.sql`](supabase/schema.sql) и нажмите **Run**.
3. **Project Settings → API** (или кнопка **Connect**) — скопируйте:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / publishable key** → `VITE_SUPABASE_ANON_KEY`
   (это публичный ключ, его можно хранить на сайте; `service_role` / secret-ключ **не** используйте)
4. Локально: скопируйте `.env.example` в `.env.local` и вставьте значения.
5. В Netlify: **Site configuration → Environment variables** → добавьте те же две переменные
   и сделайте **Trigger deploy**.

> Сайт без пароля: любой, кто знает адрес, может открыть его и поставить оценки.
> Для личного прототипа это нормально; если понадобится — добавим простой код-пароль.

## Деплой на Netlify

**Add new site → Import from Git** → выберите этот репозиторий.
Настройки сборки подтянутся из `netlify.toml` (`npm run build`, папка `dist`).

## Локальный запуск

```bash
npm install
npm run dev
```
