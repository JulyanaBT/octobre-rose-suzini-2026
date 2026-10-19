begin;
set local role authenticated;
do $$begin
 begin perform public.delete_club_manager('00000000-0000-4000-8000-000000000014');raise exception 'FAIL unauthorized delete';exception when insufficient_privilege then null;end;
 if has_function_privilege('anon','public.delete_club_manager(uuid)','EXECUTE') then raise exception 'FAIL anon grant';end if;
end$$;
reset role;
do $$declare owner uuid;begin
 select user_id into owner from public.organizers limit 1;
 if owner is null then raise exception 'Missing administrator fixture';end if;
 perform set_config('request.jwt.claim.sub',owner::text,true);
 insert into public.club_accounts(id,username,display_name,event_ids) values('00000000-0000-4000-8000-000000000014','test_delete_014','Test rollback',array['20261024-0000-4000-8000-000000000001'::uuid]);
 perform public.delete_club_manager('00000000-0000-4000-8000-000000000014');
 if exists(select 1 from public.club_accounts where id='00000000-0000-4000-8000-000000000014') then raise exception 'FAIL pending invitation deletion';end if;
end$$;
rollback;
select 'PASS: unauthorized deletion denied; disposable pending invitation removed; all fixtures rolled back' as result;
