begin;
update public.events set registration_open=true,registration_capacity=null where id='20261024-0000-4000-8000-000000000001';
set local role anon;
select public.register_sports_participant('Test','Beach','SPORTS-009-BT',true,false);
select public.register_sports_participant('Test','Tennis','SPORTS-009-TENNIS',false,true);
select public.register_sports_participant('Test','Both','SPORTS-009-BOTH',true,true);
do $$ declare denied boolean:=false;begin
 begin perform public.register_sports_participant('Test','None','SPORTS-009-NONE',false,false);exception when raise_exception then denied:=true;end;
 if not denied then raise exception 'FAIL empty choice';end if;
 if has_function_privilege('anon','public.club_save_sports_registration(uuid,uuid,integer,text,text,text,text,boolean,boolean)','EXECUTE') then raise exception 'FAIL public editing';end if;
end $$;
reset role;
do $$ begin
 if (select count(*) from public.registrations where nickname like 'SPORTS-009-%' and email is null and not present)<>3 then raise exception 'FAIL email-free registrations';end if;
 if not exists(select 1 from public.registrations where nickname='SPORTS-009-BT' and wants_bt and not wants_tennis) then raise exception 'FAIL BT';end if;
 if not exists(select 1 from public.registrations where nickname='SPORTS-009-TENNIS' and wants_tennis and not wants_bt) then raise exception 'FAIL tennis';end if;
 if not exists(select 1 from public.registrations where nickname='SPORTS-009-BOTH' and wants_tennis and wants_bt) then raise exception 'FAIL both';end if;
end $$;
insert into auth.users(id,email,email_confirmed_at) values('00000000-0000-4000-8000-000000000091','sports-test@example.invalid',now());
insert into public.event_memberships(user_id,event_id) values('00000000-0000-4000-8000-000000000091','20261024-0000-4000-8000-000000000001');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000091',true);
do $$ declare r public.registrations;denied boolean:=false;begin
 select * into r from public.registrations where nickname='SPORTS-009-BT';
 r:=public.club_save_sports_registration(r.event_id,r.id,r.version,r.first_name,r.last_name,r.nickname,'',true,true);
 if not r.wants_bt or not r.wants_tennis or r.email is not null then raise exception 'FAIL organizer update';end if;
 begin perform public.club_save_sports_registration('00000000-0000-4000-8000-000000000099',r.id,r.version,r.first_name,r.last_name,r.nickname,'',true,false);exception when raise_exception then denied:=true;end;
 if not denied then raise exception 'FAIL foreign update';end if;
end $$;
reset role;
update public.events set registration_open=false where id='20261024-0000-4000-8000-000000000001';
set local role anon;
do $$ declare denied boolean:=false;begin
 begin perform public.register_sports_participant('Test','Closed','SPORTS-009-CLOSED',true,false);exception when raise_exception then denied:=true;end;
 if not denied then raise exception 'FAIL suspension';end if;
end $$;
reset role;
rollback;
select 'PASS: no email, BT/tennis/both, required choice, Club editing, event isolation, suspension; fixtures rolled back' as verification;
