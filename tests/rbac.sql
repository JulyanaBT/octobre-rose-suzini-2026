-- Transactional smoke test: all fixtures are rolled back.
begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('00000000-0000-4000-8000-000000000011','club-test@example.invalid',now()),
 ('00000000-0000-4000-8000-000000000012','unassigned-test@example.invalid',now());
insert into public.events(id,title,published) values('00000000-0000-4000-8000-000000000021','Test événement isolé',false);
insert into public.event_memberships(event_id,user_id) values('20261024-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011');
insert into public.registrations(first_name,last_name,nickname,email,event_id) values
 ('Test','Isolation','RBAC-test-A','test@example.invalid','20261024-0000-4000-8000-000000000001'),
 ('Test','Isolation','RBAC-test-B','test@example.invalid','00000000-0000-4000-8000-000000000021');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000012',true);
do $$ begin if (select count(*) from public.registrations where nickname like 'RBAC-test-%') <> 0 then raise exception 'FAIL: unassigned access'; end if; end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000011',true);
do $$ begin if (select count(*) from public.registrations where nickname like 'RBAC-test-%') <> 1 then raise exception 'FAIL: club isolation'; end if; end $$;
do $$ begin if exists(select 1 from public.events where id='00000000-0000-4000-8000-000000000021') then raise exception 'FAIL: foreign event'; end if; end $$;
reset role;
do $$ begin if has_table_privilege('anon','public.registrations','SELECT') then raise exception 'FAIL: public contacts'; end if; end $$;
rollback;
