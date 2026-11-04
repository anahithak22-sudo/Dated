-- Выполните этот скрипт один раз: Supabase → SQL Editor → New query → Run

-- Архив мест (сами места живут в src/data/places.json)
create table if not exists public.place_state (
  place_id   text primary key,
  archived   boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Свидания: принятые комбинации и оценки за каждое место
create table if not exists public.dates (
  id          uuid primary key default gen_random_uuid(),
  day         date not null,
  food_id     text not null,
  fun_id      text not null,
  status      text not null default 'pending' check (status in ('pending', 'rated')),
  food_rating int check (food_rating between 1 and 5),
  fun_rating  int check (fun_rating between 1 and 5),
  created_at  timestamptz not null default now(),
  rated_at    timestamptz
);

-- Сайт без пароля: разрешаем анонимный доступ через публичный ключ
alter table public.place_state enable row level security;
alter table public.dates       enable row level security;

drop policy if exists "anon all place_state" on public.place_state;
create policy "anon all place_state" on public.place_state
  for all to anon using (true) with check (true);

drop policy if exists "anon all dates" on public.dates;
create policy "anon all dates" on public.dates
  for all to anon using (true) with check (true);

-- Места, добавленные через сайт (кнопка «+ Добавить место»)
create table if not exists public.custom_places (
  id         text primary key,
  data       jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.custom_places enable row level security;

drop policy if exists "anon all custom_places" on public.custom_places;
create policy "anon all custom_places" on public.custom_places
  for all to anon using (true) with check (true);
