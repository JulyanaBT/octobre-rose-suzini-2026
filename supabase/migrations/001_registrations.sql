-- Apply once to a dedicated Supabase project. Registration starts CLOSED.
begin;
create table public.event_settings (
  id boolean primary key default true check (id),
  registration_open boolean not null default false,
  capacity integer check (capacity > 0)
);
insert into public.event_settings (id) values (true);
create table public.organizers (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (length(btrim(first_name)) between 1 and 40),
  last_name text not null check (length(btrim(last_name)) between 1 and 60),
  nickname text not null check (length(btrim(nickname)) between 1 and 40),
  email text not null check (length(email) <= 150 and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  created_at timestamptz not null default now(),
  present boolean not null default false,
  activity text not null default 'welcome' check (activity in ('welcome','bt','tennis')),
  check (present or activity = 'welcome')
);
create unique index registration_nickname on public.registrations (lower(btrim(nickname)));
alter table public.event_settings enable row level security;
alter table public.organizers enable row level security;
alter table public.registrations enable row level security;
revoke all on public.event_settings, public.organizers, public.registrations from anon, authenticated;
grant select on public.event_settings to anon, authenticated;
grant select on public.organizers, public.registrations to authenticated;
create policy settings_read on public.event_settings for select to anon, authenticated using (true);
create policy own_organizer on public.organizers for select to authenticated using (user_id = (select auth.uid()));
create policy organizer_read on public.registrations for select to authenticated
using (exists (select 1 from public.organizers where user_id = (select auth.uid())));

-- Public callers can only submit a validated registration. No read access,
-- no caller-controlled attendance, activity, ID, or administrative privileges.
create function public.register_participant(first_name text, last_name text, nickname text, email text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare settings public.event_settings; result uuid;
begin
  select * into settings from public.event_settings where id = true for update;
  if not coalesce(settings.registration_open, false) then
    raise exception 'Les inscriptions ne sont pas encore ouvertes.';
  end if;
  if settings.capacity is not null and (select count(*) from public.registrations) >= settings.capacity then
    raise exception 'La capacité d’accueil est atteinte. Contactez le club.';
  end if;
  insert into public.registrations (first_name,last_name,nickname,email)
    values (btrim(first_name),btrim(last_name),btrim(nickname),lower(btrim(email))) returning id into result;
  return result;
exception
  when unique_violation then raise exception 'Ce surnom est indisponible. Ajoutez une initiale.';
  when check_violation or not_null_violation then raise exception 'Vérifiez les champs du formulaire.';
end;
$$;
revoke all on function public.register_participant(text,text,text,text) from public, anon, authenticated;
grant execute on function public.register_participant(text,text,text,text) to anon, authenticated;
commit;
