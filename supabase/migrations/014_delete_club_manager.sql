begin;
create or replace function public.delete_club_manager(p_account uuid) returns void
language plpgsql security definer set search_path='' as $$
declare a public.club_accounts;
begin
 if not exists(select 1 from public.organizers where user_id=auth.uid()) then raise insufficient_privilege;end if;
 select * into a from public.club_accounts where id=p_account for update;
 if not found then raise exception 'Ce gestionnaire n’existe plus.';end if;
 if a.user_id=auth.uid() or exists(select 1 from public.organizers where user_id=a.user_id) then raise exception 'Le compte administrateur est protégé.';end if;
 if not ('20261024-0000-4000-8000-000000000001'::uuid=any(a.event_ids)) or exists(select 1 from unnest(a.event_ids) e where e<>'20261024-0000-4000-8000-000000000001'::uuid) or exists(select 1 from public.event_memberships m where m.user_id=a.user_id and m.event_id<>'20261024-0000-4000-8000-000000000001'::uuid) then raise exception 'Ce compte a des accès hors Octobre Rose et ne peut pas être supprimé ici.';end if;
 if a.user_id is not null then
  delete from public.event_memberships where user_id=a.user_id;
  delete from auth.users where id=a.user_id;
 end if;
 delete from public.club_accounts where id=p_account;
end;$$;
revoke all on function public.delete_club_manager(uuid) from public,anon,authenticated;
grant execute on function public.delete_club_manager(uuid) to authenticated;
commit;
