begin;
create table public.events (
 id uuid primary key default gen_random_uuid(),
 title text not null check(length(btrim(title)) between 1 and 120),
 event_date date,
 location text not null default '',
 published boolean not null default false
);
insert into public.events(id,title,event_date,location,published) values
 ('20261024-0000-4000-8000-000000000001','Octobre Rose · TC Suzini','2026-10-24','TC Suzini',true);
create table public.event_memberships (
 event_id uuid references public.events(id) on delete cascade,
 user_id uuid references auth.users(id) on delete cascade,
 primary key(event_id,user_id)
);
alter table public.registrations add column event_id uuid not null default '20261024-0000-4000-8000-000000000001' references public.events(id);
alter table public.events enable row level security;
alter table public.event_memberships enable row level security;
revoke all on public.events, public.event_memberships from anon, authenticated;
grant select on public.events to anon, authenticated;
grant select on public.event_memberships to authenticated;
create policy membership_read on public.event_memberships for select to authenticated using
 (user_id=(select auth.uid()) or exists(select 1 from public.organizers where user_id=(select auth.uid())));
create policy public_events on public.events for select to anon using(published);
create policy user_events on public.events for select to authenticated using
 (exists(select 1 from public.organizers where user_id=(select auth.uid())) or exists(select 1 from public.event_memberships m where m.event_id=id and m.user_id=(select auth.uid())));
create policy club_registrations on public.registrations for select to authenticated using
 (exists(select 1 from public.event_memberships m where m.event_id=registrations.event_id and m.user_id=(select auth.uid())));

create function public.set_club_access(target_event uuid,target_email text,allow_access boolean)
returns void language plpgsql security definer set search_path='' as $$
declare target_user uuid;
begin
 if not exists(select 1 from public.organizers where user_id=auth.uid()) then raise exception 'Accès administrateur requis.'; end if;
 select id into target_user from auth.users where lower(email)=lower(btrim(target_email)) and email_confirmed_at is not null;
 if target_user is null then raise exception 'Créez et confirmez d’abord ce compte dans Supabase.'; end if;
 if allow_access then insert into public.event_memberships(event_id,user_id) values(target_event,target_user) on conflict do nothing;
 else delete from public.event_memberships where event_id=target_event and user_id=target_user; end if;
end;$$;
revoke all on function public.set_club_access(uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.set_club_access(uuid,text,boolean) to authenticated;

create function public.update_event_details(target_event uuid,new_title text,new_location text,new_date date)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not (exists(select 1 from public.organizers where user_id=auth.uid()) or exists(select 1 from public.event_memberships where user_id=auth.uid() and event_id=target_event)) then raise exception 'Cet événement ne vous est pas attribué.'; end if;
 update public.events set title=btrim(new_title),location=btrim(new_location),event_date=new_date where id=target_event;
end;$$;
revoke all on function public.update_event_details(uuid,text,text,date) from public,anon,authenticated;
grant execute on function public.update_event_details(uuid,text,text,date) to authenticated;
commit;
