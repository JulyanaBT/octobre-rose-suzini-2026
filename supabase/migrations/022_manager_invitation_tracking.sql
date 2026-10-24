begin;
alter table public.club_accounts add column if not exists invite_tracking_token uuid not null default gen_random_uuid();
alter table public.club_accounts add column if not exists invitation_opened_at timestamptz;
alter table public.club_accounts add column if not exists first_sign_in_at timestamptz;
create or replace function public.track_club_invitation(p_token uuid) returns void language sql security definer set search_path='' as $$
 update public.club_accounts set invitation_opened_at=coalesce(invitation_opened_at,now()) where invite_tracking_token=p_token and enabled and activated_at is not null;
$$;
revoke all on function public.track_club_invitation(uuid) from public,anon,authenticated;
grant execute on function public.track_club_invitation(uuid) to anon,authenticated;
create or replace function public.record_club_activity() returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise insufficient_privilege;end if;
 update public.club_accounts a set last_activity_at=now(),first_sign_in_at=coalesce(first_sign_in_at,now())
 where a.user_id=auth.uid() and a.enabled and a.activated_at is not null
 and exists(select 1 from public.event_memberships m where m.user_id=auth.uid() and m.event_id='20261024-0000-4000-8000-000000000001');
end;$$;
create or replace function public.admin_club_accounts() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from public.organizers where user_id=auth.uid()) then raise insufficient_privilege;end if;
 return jsonb_build_object('accounts',(select coalesce(jsonb_agg(jsonb_build_object('user_id',a.id,'username',a.username,'email',a.email,'enabled',a.enabled,'activated_at',a.activated_at,'invite_expires_at',a.invite_expires_at,'invitation_sent_at',a.invitation_sent_at,'last_activity_at',a.last_activity_at,'first_sign_in_at',a.first_sign_in_at,'invitation_opened_at',a.invitation_opened_at,'invite_tracking_token',a.invite_tracking_token,'last_sign_in_at',u.last_sign_in_at) order by a.created_at),'[]'::jsonb) from public.club_accounts a left join auth.users u on u.id=a.user_id where '20261024-0000-4000-8000-000000000001'::uuid=any(a.event_ids)));
end;$$;
commit;
