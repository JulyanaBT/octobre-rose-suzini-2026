begin;
alter table public.registrations alter column email drop not null;
alter table public.registrations add column wants_bt boolean;
alter table public.registrations add column wants_tennis boolean;
-- Existing registrations retain an unknown preference rather than an invented choice.
alter table public.registrations add constraint registration_sports_choice check
 ((wants_bt is null and wants_tennis is null) or (wants_bt is not null and wants_tennis is not null and (wants_bt or wants_tennis)));
create function public.club_save_sports_registration(p_event uuid,p_id uuid,p_version integer,p_first_name text,p_last_name text,p_nickname text,p_email text,p_wants_bt boolean,p_wants_tennis boolean)
returns public.registrations language plpgsql security definer set search_path='' as $$
declare saved public.registrations;
begin
 if auth.uid() is null or not (exists(select 1 from public.organizers where user_id=auth.uid()) or exists(select 1 from public.event_memberships where user_id=auth.uid() and event_id=p_event)) then
  raise exception 'Cet événement ne vous est pas attribué.';
 end if;
 if p_wants_bt is null or p_wants_tennis is null or not (p_wants_bt or p_wants_tennis) then raise exception 'Choisissez le beach tennis, le tennis ou les deux.';end if;
 if p_id is null then raise exception 'Référence manquante.'; end if;
 if p_version is null then
  insert into public.registrations(id,event_id,first_name,last_name,nickname,email,wants_bt,wants_tennis)
  values(p_id,p_event,btrim(p_first_name),btrim(p_last_name),btrim(p_nickname),nullif(lower(btrim(p_email)),''),p_wants_bt,p_wants_tennis)
  on conflict(id) do nothing returning * into saved;
  if not found then
   select * into saved from public.registrations where id=p_id and event_id=p_event;
   if not found or saved.first_name is distinct from btrim(p_first_name) or saved.last_name is distinct from btrim(p_last_name) or saved.nickname is distinct from btrim(p_nickname) or saved.email is distinct from nullif(lower(btrim(p_email)),'') or saved.wants_bt is distinct from p_wants_bt or saved.wants_tennis is distinct from p_wants_tennis then
    raise exception 'Cette référence existe déjà. Actualisez la liste.';
   end if;
  end if;
 else
  select * into saved from public.registrations where id=p_id and event_id=p_event for update;
  if not found then raise exception 'Inscription introuvable pour cet événement.'; end if;
  if saved.version <> p_version then raise exception 'Cette fiche a été modifiée par un autre gestionnaire. Actualisez la liste avant de recommencer.'; end if;
  update public.registrations set first_name=btrim(p_first_name),last_name=btrim(p_last_name),nickname=btrim(p_nickname),email=nullif(lower(btrim(p_email)),''),wants_bt=p_wants_bt,wants_tennis=p_wants_tennis,version=version+1
  where id=p_id returning * into saved;
 end if;
 return saved;
exception
 when unique_violation then raise exception 'Ce surnom est indisponible. Ajoutez une initiale.';
 when check_violation or not_null_violation then raise exception 'Vérifiez les champs du formulaire.';
end;$$;

create function public.register_sports_participant(first_name text,last_name text,nickname text,wants_bt boolean,wants_tennis boolean)
returns uuid language plpgsql security definer set search_path='' as $$
declare settings public.events;result uuid;
begin
 if wants_bt is null or wants_tennis is null or not(wants_bt or wants_tennis) then raise exception 'Choisissez le beach tennis, le tennis ou les deux.';end if;
 select * into settings from public.events where id='20261024-0000-4000-8000-000000000001' for update;
 if not coalesce(settings.registration_open,false) or not coalesce(settings.published,false) then raise exception 'Les inscriptions sont suspendues. Merci de revenir plus tard.';end if;
 if settings.registration_capacity is not null and (select count(*) from public.registrations where event_id=settings.id)>=settings.registration_capacity then raise exception 'La capacité d’accueil est atteinte. Contactez le club.';end if;
 insert into public.registrations(first_name,last_name,nickname,event_id,wants_bt,wants_tennis)
 values(btrim(first_name),btrim(last_name),btrim(nickname),settings.id,wants_bt,wants_tennis) returning id into result;
 return result;
exception
 when unique_violation then raise exception 'Ce surnom est indisponible. Ajoutez une initiale.';
 when check_violation or not_null_violation then raise exception 'Vérifiez les champs du formulaire.';
end;$$;

revoke all on function public.register_participant(text,text,text,text) from public,anon,authenticated;
revoke all on function public.register_sports_participant(text,text,text,boolean,boolean) from public,anon,authenticated;
grant execute on function public.register_sports_participant(text,text,text,boolean,boolean) to anon,authenticated;
revoke all on function public.club_save_sports_registration(uuid,uuid,integer,text,text,text,text,boolean,boolean) from public,anon,authenticated;
grant execute on function public.club_save_sports_registration(uuid,uuid,integer,text,text,text,text,boolean,boolean) to authenticated;
commit;
