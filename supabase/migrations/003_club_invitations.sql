begin;
-- Invitations only create Club accounts; the existing sole organizer remains unchanged.
create table public.club_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check (username ~ '^[a-z][a-z0-9_-]{1,29}$'),
 display_name text not null check(length(btrim(display_name)) between 1 and 80),
 email text not null unique,
 enabled boolean not null default true,
 event_ids uuid[] not null default '{}',
 activated_at timestamptz,
 invitation_sent_at timestamptz,
 invite_expires_at timestamptz,
 created_at timestamptz not null default now()
);
alter table public.club_accounts enable row level security;
revoke all on public.club_accounts from anon,authenticated;
-- Service-only atomic application of assignments, never organizer privileges.
create function public.apply_club_assignments(target_user uuid, assigned_events uuid[], access_enabled boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.organizers where user_id=target_user) then raise exception 'Compte administrateur protégé.'; end if;
 if exists(select 1 from unnest(assigned_events) e where not exists(select 1 from public.events where id=e)) then raise exception 'Événement inconnu.'; end if;
 update public.club_accounts set event_ids=assigned_events,enabled=access_enabled where user_id=target_user;
 if not found then raise exception 'Compte inconnu.'; end if;
 delete from public.event_memberships where user_id=target_user;
 if access_enabled and exists(select 1 from public.club_accounts where user_id=target_user and activated_at is not null) then
 insert into public.event_memberships(event_id,user_id) select distinct unnest(assigned_events),target_user;
 end if;
end;$$;
revoke all on function public.apply_club_assignments(uuid,uuid[],boolean) from public,anon,authenticated;
grant execute on function public.apply_club_assignments(uuid,uuid[],boolean) to service_role;
create function public.finish_club_activation(target_user uuid)
returns void language plpgsql security definer set search_path='' as $$
declare account public.club_accounts;
begin
 select * into account from public.club_accounts where user_id=target_user for update;
 if not found or not account.enabled or account.activated_at is not null or account.invite_expires_at < now() then raise exception 'Invitation expirée ou annulée.'; end if;
 if exists(select 1 from public.organizers where user_id=target_user) then raise exception 'Compte administrateur protégé.'; end if;
 update public.club_accounts set activated_at=now(),invite_expires_at=null where user_id=target_user;
 insert into public.event_memberships(event_id,user_id) select distinct unnest(account.event_ids),target_user on conflict do nothing;
end;$$;
revoke all on function public.finish_club_activation(uuid) from public,anon,authenticated;
grant execute on function public.finish_club_activation(uuid) to service_role;
commit;
