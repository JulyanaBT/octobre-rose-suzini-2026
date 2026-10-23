begin;
insert into public.events(id,title,published) values('00000000-0000-4000-8000-000000000011','TEST PUBLIC BT',true),('00000000-0000-4000-8000-000000000012','TEST PRIVATE BT',false);
insert into public.registrations(event_id,first_name,last_name,nickname,email,wants_bt,wants_tennis,activity,present) values('00000000-0000-4000-8000-000000000011','PrivateFirst','PrivateLast','PUBLIC-011-BT','private@example.invalid',true,false,'prevention',true),('00000000-0000-4000-8000-000000000011','PrivateFirst','PrivateLast','PUBLIC-011-TENNIS','private2@example.invalid',false,true,'tennis',true);
set local role anon;
do $$ declare data jsonb;denied boolean:=false;begin
 data:=public.public_bt('00000000-0000-4000-8000-000000000011');
 if jsonb_array_length(data->'players')<>1 or data->'players'->0->>'nickname'<>'PUBLIC-011-BT' then raise exception 'FAIL player projection';end if;
 if data::text like '%Private%' or data::text like '%@%' or data::text like '%email%' or data::text like '%first_name%' then raise exception 'FAIL privacy';end if;
 if data->'players'->0->>'present'<>'true' or data->'players'->0->>'activity'<>'prevention' then raise exception 'FAIL public activity status';end if;
 if data->'matches'<>'[]'::jsonb then raise exception 'FAIL empty matches';end if;
 begin perform public.public_bt('00000000-0000-4000-8000-000000000012');exception when raise_exception then denied:=true;end;
 if not denied then raise exception 'FAIL unpublished event';end if;
 if has_function_privilege('anon','public.club_bt(uuid,text,integer,jsonb)','EXECUTE') or has_table_privilege('anon','public.beach_tennis_state','UPDATE') then raise exception 'FAIL write grants';end if;
 begin perform public.club_bt('00000000-0000-4000-8000-000000000011','score',0,'{}');raise exception 'FAIL anon mutation';exception when insufficient_privilege then null;end;
end $$;
rollback;
select 'PASS: public sports only, activity badges without contact details, unpublished events denied, writes denied; fixtures rolled back' as result;
