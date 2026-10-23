begin;
create or replace function public.public_participants(p_event uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from public.events where id=p_event and published) then raise exception 'Cet événement n’est pas disponible.';end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('nickname',r.nickname,'wants_bt',r.wants_bt,'wants_tennis',r.wants_tennis,'active',r.present,'activity',case when not r.present then 'inactive' when r.activity in ('bt','tennis','prevention') then r.activity else 'unspecified' end) order by r.nickname),'[]'::jsonb) from public.registrations r where r.event_id=p_event);
end;$$;
revoke all on function public.public_participants(uuid) from public,anon,authenticated;
grant execute on function public.public_participants(uuid) to anon,authenticated;
commit;
