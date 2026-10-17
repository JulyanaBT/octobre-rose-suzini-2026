begin;
alter table public.events add column registration_open boolean not null default false;
alter table public.events add column registration_version integer not null default 0;
alter table public.events add column registration_capacity integer check(registration_capacity>0);
-- Preserve the existing state; deploying the control does not open registrations.
update public.events e set registration_open=s.registration_open,registration_capacity=s.capacity
from public.event_settings s where s.id=true and e.id='20261024-0000-4000-8000-000000000001';
create function public.set_registration_open(p_event uuid,p_open boolean,p_version integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.events;
begin
 if auth.uid() is null or not (exists(select 1 from public.organizers where user_id=auth.uid()) or exists(select 1 from public.event_memberships where user_id=auth.uid() and event_id=p_event)) then raise exception 'Cet événement ne vous est pas attribué.';end if;
 if p_open is null then raise exception 'État des inscriptions invalide.';end if;
 select * into e from public.events where id=p_event for update;
 if not found then raise exception 'Événement introuvable.';end if;
 if p_version is null or e.registration_version<>p_version then raise exception 'L’état a changé. Actualisez avant de recommencer.';end if;
 update public.events set registration_open=p_open,registration_version=registration_version+1 where id=p_event returning * into e;
 -- Keep legacy clients consistent for this event.
 if p_event='20261024-0000-4000-8000-000000000001' then update public.event_settings set registration_open=p_open where id=true;end if;
 return jsonb_build_object('open',e.registration_open,'version',e.registration_version);
end;$$;
revoke all on function public.set_registration_open(uuid,boolean,integer) from public,anon,authenticated;
grant execute on function public.set_registration_open(uuid,boolean,integer) to authenticated;

create or replace function public.register_participant(first_name text,last_name text,nickname text,email text)
returns uuid language plpgsql security definer set search_path='' as $$
declare settings public.events;result uuid;
begin
 select * into settings from public.events where id='20261024-0000-4000-8000-000000000001' for update;
 if not coalesce(settings.registration_open,false) or not coalesce(settings.published,false) then raise exception 'Les inscriptions sont suspendues. Merci de revenir plus tard.';end if;
 if settings.registration_capacity is not null and (select count(*) from public.registrations where event_id=settings.id)>=settings.registration_capacity then raise exception 'La capacité d’accueil est atteinte. Contactez le club.';end if;
 insert into public.registrations(first_name,last_name,nickname,email,event_id)
 values(btrim(first_name),btrim(last_name),btrim(nickname),lower(btrim(email)),settings.id) returning id into result;
 return result;
exception
 when unique_violation then raise exception 'Ce surnom est indisponible. Ajoutez une initiale.';
 when check_violation or not_null_violation then raise exception 'Vérifiez les champs du formulaire.';
end;$$;
commit;
