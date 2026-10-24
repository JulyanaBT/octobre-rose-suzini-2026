begin;
create or replace function public.finalize_password_club_account(p_account uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare a public.club_accounts; u auth.users;
begin
 select * into a from public.club_accounts where id=p_account for update;
 if not found or not a.enabled or a.event_ids<>array['20261024-0000-4000-8000-000000000001'::uuid] then raise exception 'Compte indisponible';end if;
 if a.user_id is not null then
  if not exists(select 1 from public.event_memberships where user_id=a.user_id and event_id='20261024-0000-4000-8000-000000000001') then raise exception 'Accès Club manquant';end if;
  return a.user_id;
 end if;
 select * into u from auth.users where email=a.id::text||'@accounts.invalid';
 if not found then return null;end if;
 if u.raw_app_meta_data->>'club_invitation_id' is distinct from a.id::text or u.raw_app_meta_data->>'club_invitation_hash' is distinct from a.invitation_hash or a.invitation_hash is null then raise exception 'Liaison de compte non vérifiable';end if;
 if exists(select 1 from public.organizers where user_id=u.id) then raise exception 'Compte protégé';end if;
 update public.club_accounts set user_id=u.id,email=u.email,activated_at=now(),invitation_hash=null,invite_expires_at=null where id=a.id;
 insert into public.event_memberships(event_id,user_id) values('20261024-0000-4000-8000-000000000001',u.id) on conflict do nothing;
 update auth.users set raw_app_meta_data=raw_app_meta_data-'club_invitation_id'-'club_invitation_hash' where id=u.id;
 return u.id;
end;$$;
revoke all on function public.finalize_password_club_account(uuid) from public,anon,authenticated;
grant execute on function public.finalize_password_club_account(uuid) to service_role;
commit;
