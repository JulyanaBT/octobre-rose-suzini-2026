begin;
alter table public.club_accounts add column id uuid default gen_random_uuid();
update public.club_accounts set id=user_id;
alter table public.club_accounts drop constraint club_accounts_pkey;
alter table public.club_accounts add primary key(id);
alter table public.club_accounts alter column user_id drop not null;
alter table public.club_accounts add unique(user_id);
alter table public.club_accounts alter column email drop not null;
alter table public.club_accounts add column invitation_hash text;
-- Auth creation and invitation redemption share one transaction. A failed or
-- concurrent redemption rolls back the new auth user as well as memberships.
create function public.redeem_club_invitation() returns trigger
language plpgsql security definer set search_path='' as $$
declare invitation public.club_accounts;
begin
 if new.raw_app_meta_data->>'club_invitation_id' is null then return new; end if;
 select * into invitation from public.club_accounts
 where id=(new.raw_app_meta_data->>'club_invitation_id')::uuid for update;
 if not found or invitation.user_id is not null or not invitation.enabled
 or invitation.activated_at is not null or invitation.invite_expires_at is null
 or invitation.invite_expires_at<=now() or invitation.invitation_hash is null
 or invitation.invitation_hash is distinct from new.raw_app_meta_data->>'club_invitation_hash'
 then raise exception 'Invitation indisponible'; end if;
 update public.club_accounts set user_id=new.id,email=lower(new.email),activated_at=now(),
 invitation_hash=null,invite_expires_at=null where id=invitation.id;
 insert into public.event_memberships(event_id,user_id)
 select distinct unnest(invitation.event_ids),new.id;
 update auth.users set raw_app_meta_data=raw_app_meta_data-'club_invitation_id'-'club_invitation_hash' where id=new.id;
 return new;
end;$$;
revoke all on function public.redeem_club_invitation() from public,anon,authenticated;
create trigger redeem_club_invitation after insert on auth.users
 for each row execute function public.redeem_club_invitation();
create or replace function public.apply_club_assignments(target_user uuid, assigned_events uuid[], access_enabled boolean)
returns void language plpgsql security definer set search_path='' as $$
declare account public.club_accounts;
begin
 select * into account from public.club_accounts where id=target_user for update;
 if not found then raise exception 'Compte inconnu.'; end if;
 if exists(select 1 from public.organizers where user_id=account.user_id) then raise exception 'Compte administrateur protégé.'; end if;
 if assigned_events is null or exists(select 1 from unnest(assigned_events) e where not exists(select 1 from public.events where id=e)) then raise exception 'Événement inconnu.'; end if;
 update public.club_accounts set event_ids=assigned_events,enabled=access_enabled where id=target_user;
 delete from public.event_memberships where user_id=account.user_id;
 if access_enabled and account.activated_at is not null then
 insert into public.event_memberships(event_id,user_id) select distinct unnest(assigned_events),account.user_id;
 end if;
end;$$;
commit;
