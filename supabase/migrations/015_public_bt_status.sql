begin;
-- Public sporting projection only. Registration contact data and all write RPCs remain protected.
create or replace function public.public_bt(p_event uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare games jsonb; people jsonb;
begin
 if not exists(select 1 from public.events where id=p_event and published) then raise exception 'Cet événement n’est pas disponible.';end if;
 select coalesce(s.matches,'[]'::jsonb) into games from public.beach_tennis_state s where s.event_id=p_event;
 games:=coalesce(games,'[]'::jsonb);
 select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'nickname',r.nickname,'wants_bt',true,'present',r.present,'activity',r.activity) order by r.nickname),'[]'::jsonb) into people
 from public.registrations r where r.event_id=p_event and (r.wants_bt or r.activity='bt' or exists(select 1 from jsonb_array_elements(games) m where (m->'teamA') ? r.id::text or (m->'teamB') ? r.id::text or (m->'bench') ? r.id::text));
 return jsonb_build_object('players',people,'matches',games);
end;$$;
revoke all on function public.public_bt(uuid) from public,anon,authenticated;
grant execute on function public.public_bt(uuid) to anon,authenticated;
commit;
