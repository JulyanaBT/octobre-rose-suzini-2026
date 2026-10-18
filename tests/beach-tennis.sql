begin;
insert into public.events(id,title) values('00000000-0000-4000-8000-000000000010','TEST BT');
insert into auth.users(id,email,email_confirmed_at) values('00000000-0000-4000-8000-000000000010','bt-test@example.invalid',now());
insert into public.event_memberships(user_id,event_id) values('00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000010');
insert into public.registrations(id,event_id,first_name,last_name,nickname,present,activity,wants_bt,wants_tennis)
select ('00000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,'00000000-0000-4000-8000-000000000010','Test','BT','TEST-BT-010-'||i,true,'bt',true,false from generate_series(101,109) i;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000010',true);
do $$ declare s jsonb;r jsonb;roster text[];e uuid:='00000000-0000-4000-8000-000000000010';blocked boolean;begin
 s:=public.club_bt(e);
 select array_agg(id::text order by id) into roster from public.registrations where event_id=e;
 r:=jsonb_build_array(jsonb_build_object('teamA',roster[1:2],'teamB',roster[3:4],'bench',roster[9:9]),jsonb_build_object('teamA',roster[5:6],'teamB',roster[7:8],'bench',roster[9:9]));
 s:=public.club_bt(e,'round',0,r);
 if jsonb_array_length(s->'matches')<>2 or (s->>'version')::int<>1 then raise exception 'FAIL round';end if;
 blocked:=false;begin perform public.club_bt(e,'round',0,r);exception when raise_exception then blocked:=true;end;if not blocked then raise exception 'FAIL stale version';end if;
 blocked:=false;begin perform public.club_bt(e,'round',1,r);exception when raise_exception then blocked:=true;end;if not blocked then raise exception 'FAIL pending';end if;
 blocked:=false;begin perform public.club_set_participation(e,roster[1]::uuid,0,true,'tennis');exception when raise_exception then blocked:=true;end;if not blocked then raise exception 'FAIL assignment guard';end if;
 blocked:=false;begin perform public.club_bt('20261024-0000-4000-8000-000000000001');exception when raise_exception then blocked:=true;end;if not blocked then raise exception 'FAIL isolation';end if;
 blocked:=false;begin perform public.club_bt(e,'score',1,jsonb_build_object('id',s->'matches'->0->>'id','a',5,'b',5));exception when raise_exception then blocked:=true;end;if not blocked then raise exception 'FAIL equal score';end if;
 s:=public.club_bt(e,'score',1,jsonb_build_object('id',s->'matches'->0->>'id','a',6,'b',3));
 s:=public.club_bt(e,'score',2,jsonb_build_object('id',s->'matches'->1->>'id','a',4,'b',6));
 if s->'matches'->1->>'winner'<>'B' then raise exception 'FAIL score';end if;
 perform public.club_set_participation(e,roster[1]::uuid,0,true,'tennis');
 blocked:=false;begin perform public.club_bt(e,'round',3,r);exception when raise_exception then blocked:=true;end;if not blocked then raise exception 'FAIL changed roster';end if;
 if has_function_privilege('anon','public.club_bt(uuid,text,integer,jsonb)','EXECUTE') then raise exception 'FAIL anonymous access';end if;
end $$;
rollback;
select 'PASS: 2 courts, scores, concurrency, pending match guard, roster validation, event isolation; fixtures rolled back' as result;
