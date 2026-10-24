begin;
create table if not exists public.site_maintenance (
 id boolean primary key default true check(id),
 pages text[] not null default '{}',
 club_blocked boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.site_maintenance enable row level security;
revoke all on public.site_maintenance from anon,authenticated;
insert into public.site_maintenance(id) values(true) on conflict do nothing;
create or replace function public.get_site_maintenance() returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('pages',pages,'club_blocked',club_blocked) from public.site_maintenance where id;
$$;
create or replace function public.set_site_maintenance(p_pages text[],p_club_blocked boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.organizers where user_id=auth.uid()) then raise insufficient_privilege;end if;
 if p_pages is null or p_club_blocked is null or array_position(p_pages,null) is not null or not(p_pages <@ array['accueil','inscription','participants','raquettes','information','convivialite','infos']::text[]) then raise exception 'Sélection de pages invalide.';end if;
 update public.site_maintenance set pages=p_pages,club_blocked=p_club_blocked,updated_at=now() where id;
end;$$;
revoke all on function public.get_site_maintenance() from public;
revoke all on function public.set_site_maintenance(text[],boolean) from public,anon;
grant execute on function public.get_site_maintenance() to anon,authenticated;
grant execute on function public.set_site_maintenance(text[],boolean) to authenticated;
commit;
