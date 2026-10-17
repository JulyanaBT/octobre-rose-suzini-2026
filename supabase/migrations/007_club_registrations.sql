begin;
alter table public.registrations drop constraint registrations_activity_check;
alter table public.registrations add constraint registrations_activity_check check(activity in ('welcome','bt','tennis','prevention'));
alter table public.registrations add column version integer not null default 0;

-- Narrow RPCs only: no direct write grants and no ability to move an attendee to another event.
create function public.club_save_registration(p_event uuid,p_id uuid,p_version integer,p_first_name text,p_last_name text,p_nickname text,p_email text)
returns public.registrations language plpgsql security definer set search_path='' as $$
declare saved public.registrations;
begin
 if auth.uid() is null or not (exists(select 1 from public.organizers where user_id=auth.uid()) or exists(select 1 from public.event_memberships where user_id=auth.uid() and event_id=p_event)) then
  raise exception 'Cet événement ne vous est pas attribué.';
 end if;
 if p_id is null then raise exception 'Référence manquante.'; end if;
 if p_version is null then
  insert into public.registrations(id,event_id,first_name,last_name,nickname,email)
  values(p_id,p_event,btrim(p_first_name),btrim(p_last_name),btrim(p_nickname),lower(btrim(p_email)))
  on conflict(id) do nothing returning * into saved;
  if not found then
   select * into saved from public.registrations where id=p_id and event_id=p_event;
   if not found or saved.first_name is distinct from btrim(p_first_name) or saved.last_name is distinct from btrim(p_last_name) or saved.nickname is distinct from btrim(p_nickname) or saved.email is distinct from lower(btrim(p_email)) then
    raise exception 'Cette référence existe déjà. Actualisez la liste.';
   end if;
  end if;
 else
  select * into saved from public.registrations where id=p_id and event_id=p_event for update;
  if not found then raise exception 'Inscription introuvable pour cet événement.'; end if;
  if saved.version <> p_version then raise exception 'Cette fiche a été modifiée par un autre gestionnaire. Actualisez la liste avant de recommencer.'; end if;
  update public.registrations set first_name=btrim(p_first_name),last_name=btrim(p_last_name),nickname=btrim(p_nickname),email=lower(btrim(p_email)),version=version+1
  where id=p_id returning * into saved;
 end if;
 return saved;
exception
 when unique_violation then raise exception 'Ce surnom est indisponible. Ajoutez une initiale.';
 when check_violation or not_null_violation then raise exception 'Vérifiez les champs du formulaire.';
end;$$;

create function public.club_set_participation(p_event uuid,p_id uuid,p_version integer,p_present boolean,p_activity text)
returns public.registrations language plpgsql security definer set search_path='' as $$
declare saved public.registrations;
begin
 if auth.uid() is null or not (exists(select 1 from public.organizers where user_id=auth.uid()) or exists(select 1 from public.event_memberships where user_id=auth.uid() and event_id=p_event)) then
  raise exception 'Cet événement ne vous est pas attribué.';
 end if;
 if p_present is null or p_activity is null or p_activity not in ('welcome','bt','tennis','prevention') then raise exception 'Présence ou activité invalide.'; end if;
 select * into saved from public.registrations where id=p_id and event_id=p_event for update;
 if not found then raise exception 'Inscription introuvable pour cet événement.'; end if;
 if p_version is null or saved.version <> p_version then raise exception 'Cette fiche a été modifiée par un autre gestionnaire. Actualisez la liste avant de recommencer.'; end if;
 update public.registrations set present=p_present,activity=case when p_present then p_activity else 'welcome' end,version=version+1 where id=p_id returning * into saved;
 return saved;
end;$$;
revoke all on function public.club_save_registration(uuid,uuid,integer,text,text,text,text) from public,anon,authenticated;
revoke all on function public.club_set_participation(uuid,uuid,integer,boolean,text) from public,anon,authenticated;
grant execute on function public.club_save_registration(uuid,uuid,integer,text,text,text,text) to authenticated;
grant execute on function public.club_set_participation(uuid,uuid,integer,boolean,text) to authenticated;
commit;
