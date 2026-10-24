begin;
create table public.massage_slots (
 event_id uuid not null references public.events(id) on delete cascade,
 slot integer not null check(slot between 0 and 5),
 participant_id uuid references public.registrations(id) on delete set null,
 version integer not null default 0,
 primary key(event_id,slot),
 unique(event_id,participant_id)
);
alter table public.massage_slots enable row level security;
revoke all on public.massage_slots from anon,authenticated;
insert into public.massage_slots(event_id,slot) select '20261024-0000-4000-8000-000000000001',generate_series(0,5);
create function public.public_massage(p_event uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from public.events where id=p_event and published) then raise exception 'Événement indisponible.';end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('slot',slot,'reserved',participant_id is not null) order by slot),'[]'::jsonb) from public.massage_slots where event_id=p_event);
end;$$;
create function public.club_massage(p_event uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not(exists(select 1 from public.organizers where user_id=auth.uid()) or exists(select 1 from public.event_memberships where user_id=auth.uid() and event_id=p_event)) then raise exception 'Accès Club requis.';end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('slot',s.slot,'participant_id',s.participant_id,'version',s.version,'nickname',r.nickname) order by s.slot),'[]'::jsonb) from public.massage_slots s left join public.registrations r on r.id=s.participant_id where s.event_id=p_event);
end;$$;
create function public.assign_massage(p_event uuid,p_slot integer,p_participant uuid,p_version integer) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not(exists(select 1 from public.organizers where user_id=auth.uid()) or exists(select 1 from public.event_memberships where user_id=auth.uid() and event_id=p_event)) then raise exception 'Accès Club requis.';end if;
 if p_participant is not null and not exists(select 1 from public.registrations where id=p_participant and event_id=p_event) then raise exception 'Choisissez une personne inscrite à cet événement.';end if;
 update public.massage_slots set participant_id=p_participant,version=version+1 where event_id=p_event and slot=p_slot and version=p_version;
 if not found then raise exception 'Ce créneau a été modifié. Actualisez puis réessayez.';end if;
exception when unique_violation then raise exception 'Cette personne a déjà un créneau de massage. Libérez-le avant de la déplacer.';
end;$$;
revoke all on function public.public_massage(uuid),public.club_massage(uuid),public.assign_massage(uuid,integer,uuid,integer) from public,anon,authenticated;
grant execute on function public.public_massage(uuid) to anon,authenticated;
grant execute on function public.club_massage(uuid),public.assign_massage(uuid,integer,uuid,integer) to authenticated;
commit;
