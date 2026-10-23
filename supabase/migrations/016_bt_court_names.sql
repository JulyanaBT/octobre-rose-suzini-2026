begin;
create or replace function public.club_bt(p_event uuid,p_action text default 'read',p_version integer default null,p_data jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.beach_tennis_state; m jsonb; clean jsonb:='[]'; ids text[]:='{}'; active_ids text[]; bench jsonb; n integer; idx integer:=0; a integer; b integer; target text; found_match boolean:=false;
begin
 if auth.uid() is null or not (exists(select 1 from public.organizers where user_id=auth.uid()) or exists(select 1 from public.event_memberships where user_id=auth.uid() and event_id=p_event)) then raise exception 'Cet événement ne vous est pas attribué.';end if;
 -- All mutations serialize on the event, including participant availability changes.
 perform 1 from public.events where id=p_event for update;
 if not found then raise exception 'Événement introuvable.';end if;
 insert into public.beach_tennis_state(event_id) values(p_event) on conflict do nothing;
 select * into s from public.beach_tennis_state where event_id=p_event for update;
 if p_action='read' then return jsonb_build_object('version',s.version,'matches',s.matches);end if;
 if p_version is distinct from s.version then raise exception 'Les matchs ont été modifiés. Rechargez la page avant de recommencer.';end if;
 if p_action='round' then
  if exists(select 1 from jsonb_array_elements(s.matches) x where x->>'status'<>'completed') then raise exception 'Terminez les matchs en cours avant le prochain tour.';end if;
  if jsonb_typeof(p_data) is distinct from 'array' or jsonb_array_length(p_data) not between 1 and 2 then raise exception 'Un ou deux matchs sont nécessaires.';end if;
  select coalesce(max((x->>'roundNumber')::int),0)+1 into n from jsonb_array_elements(s.matches) x;
  bench:=p_data->0->'bench';
  if jsonb_typeof(bench) is distinct from 'array' then raise exception 'Banc invalide.';end if;
  for m in select value from jsonb_array_elements(p_data) loop
   idx:=idx+1;
   if jsonb_array_length(m->'teamA') is distinct from 2 or jsonb_array_length(m->'teamB') is distinct from 2 or m->'bench' is distinct from bench then raise exception 'Équipes invalides.';end if;
   ids:=ids || array(select jsonb_array_elements_text(m->'teamA')) || array(select jsonb_array_elements_text(m->'teamB'));
   clean:=clean || jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'roundNumber',n,'matchIndex',idx,'court',case when idx=1 then '🐝 Manon Queen Bee' else '🌶️ Lisa de los pimentos' end,'teamA',m->'teamA','teamB',m->'teamB','bench',bench,'scoreA',null,'scoreB',null,'status','pending','winner',null));
  end loop;
  ids:=ids || array(select jsonb_array_elements_text(bench));
  select array_agg(id::text order by id::text) into active_ids from public.registrations where event_id=p_event and present and activity='bt';
  if cardinality(ids) is distinct from (select count(distinct x) from unnest(ids) x) or (select array_agg(x order by x) from unnest(ids) x) is distinct from active_ids or idx<>least(2,coalesce(cardinality(active_ids),0)/4) then raise exception 'La liste des joueurs actifs a changé. Rechargez la page.';end if;
  s.matches:=s.matches || clean;
 elsif p_action='score' then
  a:=(p_data->>'a')::integer;b:=(p_data->>'b')::integer;target:=p_data->>'id';
  if a is null or b is null or a<0 or b<0 or a>999 or b>999 or a=b then raise exception 'Indiquez deux scores différents entre 0 et 999.';end if;
  for m in select value from jsonb_array_elements(s.matches) loop
   if m->>'id'=target then found_match:=true;m:=m || jsonb_build_object('scoreA',a,'scoreB',b,'status','completed','winner',case when a>b then 'A' else 'B' end);end if;
   clean:=clean || jsonb_build_array(m);
  end loop;
  if not found_match then raise exception 'Match introuvable.';end if;
  s.matches:=clean;
 else raise exception 'Action inconnue.';end if;
 update public.beach_tennis_state set matches=s.matches,version=version+1 where event_id=p_event returning * into s;
 return jsonb_build_object('version',s.version,'matches',s.matches);
end;$$;
revoke all on function public.club_bt(uuid,text,integer,jsonb) from public,anon,authenticated;
grant execute on function public.club_bt(uuid,text,integer,jsonb) to authenticated;
commit;
