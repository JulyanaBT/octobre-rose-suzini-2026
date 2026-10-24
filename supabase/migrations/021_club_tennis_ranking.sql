begin;
alter table public.registrations add column tennis_ranking text check (char_length(tennis_ranking)<=20);
create function public.club_save_ranked_registration(p_event uuid,p_id uuid,p_version integer,p_first_name text,p_last_name text,p_nickname text,p_email text,p_wants_bt boolean,p_wants_tennis boolean,p_tennis_ranking text)
returns public.registrations language plpgsql security definer set search_path='' as $$
declare saved public.registrations;
begin
 -- Existing RPC checks membership, validates fields and locks the version atomically.
 saved := public.club_save_sports_registration(p_event,p_id,p_version,p_first_name,p_last_name,p_nickname,p_email,p_wants_bt,p_wants_tennis);
 update public.registrations set tennis_ranking=nullif(btrim(p_tennis_ranking),'') where id=saved.id returning * into saved;
 return saved;
end;$$;
revoke all on function public.club_save_ranked_registration(uuid,uuid,integer,text,text,text,text,boolean,boolean,text) from public,anon,authenticated;
grant execute on function public.club_save_ranked_registration(uuid,uuid,integer,text,text,text,text,boolean,boolean,text) to authenticated;
-- Public RPCs use explicit field lists and never return tennis_ranking.
commit;
