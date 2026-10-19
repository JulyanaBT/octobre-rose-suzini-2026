begin;
alter table public.club_accounts add column if not exists last_activity_at timestamptz;
create or replace function public.record_club_activity() returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise insufficient_privilege; end if;
 update public.club_accounts a set last_activity_at=now()
 where a.user_id=auth.uid() and a.enabled and a.activated_at is not null
 and '20261024-0000-4000-8000-000000000001'::uuid=any(a.event_ids)
 and exists(select 1 from public.event_memberships m where m.user_id=auth.uid() and m.event_id='20261024-0000-4000-8000-000000000001'::uuid)
 and (a.last_activity_at is null or a.last_activity_at<now()-interval '1 minute');
end;$$;
create or replace function public.admin_club_accounts() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from public.organizers where user_id=auth.uid()) then raise insufficient_privilege;end if;
 return jsonb_build_object('accounts',(select coalesce(jsonb_agg(jsonb_build_object('user_id',a.id,'username',a.username,'email',a.email,'enabled',a.enabled,'activated_at',a.activated_at,'invite_expires_at',a.invite_expires_at,'invitation_sent_at',a.invitation_sent_at,'last_activity_at',a.last_activity_at,'last_sign_in_at',u.last_sign_in_at) order by a.created_at),'[]'::jsonb) from public.club_accounts a left join auth.users u on u.id=a.user_id where '20261024-0000-4000-8000-000000000001'::uuid=any(a.event_ids)));
end;$$;
revoke all on function public.record_club_activity() from public,anon,authenticated;
revoke all on function public.admin_club_accounts() from public,anon,authenticated;
grant execute on function public.record_club_activity() to authenticated;
grant execute on function public.admin_club_accounts() to authenticated;
commit;
