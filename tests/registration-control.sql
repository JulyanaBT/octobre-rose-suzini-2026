begin;
insert into auth.users(id,email,email_confirmed_at) values('00000000-0000-4000-8000-000000000081','opening-test@example.invalid',now());
insert into public.event_memberships(user_id,event_id) values('00000000-0000-4000-8000-000000000081','20261024-0000-4000-8000-000000000001');
insert into public.events(id,title,published) values('00000000-0000-4000-8000-000000000082','Opening foreign event test',false);
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000081',true);
do $$ declare v integer;res jsonb;denied boolean:=false;begin
 select registration_version into v from public.events where id='20261024-0000-4000-8000-000000000001';
 res:=public.set_registration_open('20261024-0000-4000-8000-000000000001',false,v);
 if (res->>'open')::boolean then raise exception 'FAIL suspension';end if;
 begin perform public.set_registration_open('00000000-0000-4000-8000-000000000082',true,0);exception when raise_exception then denied:=true;end;
 if not denied then raise exception 'FAIL foreign control';end if;
 denied:=false;begin perform public.set_registration_open('20261024-0000-4000-8000-000000000001',true,v);exception when raise_exception then denied:=true;end;
 if not denied then raise exception 'FAIL stale control';end if;
end $$;
set local role anon;
do $$ declare denied boolean:=false;begin
 begin perform public.register_sports_participant('Test','Suspension','OPENING-TEST-008',true,false);exception when raise_exception then denied:=true;end;
 if not denied then raise exception 'FAIL public submission during suspension';end if;
 if has_function_privilege('anon','public.set_registration_open(uuid,boolean,integer)','EXECUTE') then raise exception 'FAIL anonymous control';end if;
end $$;
set local role authenticated;
do $$ declare v integer;res jsonb;begin
 select registration_version into v from public.events where id='20261024-0000-4000-8000-000000000001';
 res:=public.set_registration_open('20261024-0000-4000-8000-000000000001',true,v);
 if not (res->>'open')::boolean then raise exception 'FAIL opening';end if;
end $$;
-- Capacity is separate from opening; ensure the isolated test is not affected by it.
reset role;
update public.events set registration_capacity=null where id='20261024-0000-4000-8000-000000000001';
set local role anon;
select public.register_sports_participant('Test','Reopening','OPENING-TEST-008',true,false);
reset role;
do $$ begin
 if not exists(select 1 from public.registrations where nickname='OPENING-TEST-008' and present=false and activity='welcome') then raise exception 'FAIL new registrations start non-active';end if;
end $$;
rollback;
select 'PASS: suspend/reopen, blocked public submissions, non-active default, event isolation, stale writes, anonymous denial; state restored' as verification;
