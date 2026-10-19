begin;
set local role authenticated;
do $$begin
 begin perform public.admin_club_accounts();raise exception 'FAIL non-admin access';exception when insufficient_privilege then null;end;
 begin perform public.record_club_activity();raise exception 'FAIL anonymous activity';exception when insufficient_privilege then null;end;
 if has_function_privilege('anon','public.admin_club_accounts()','EXECUTE') then raise exception 'FAIL anon grant';end if;
 if has_function_privilege('anon','public.record_club_activity()','EXECUTE') then raise exception 'FAIL anon tracking';end if;
end$$;
rollback;
select 'PASS: admin list denied without administrator identity; anonymous activity denied' as result;
