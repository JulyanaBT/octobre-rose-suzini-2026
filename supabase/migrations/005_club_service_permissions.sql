begin;
-- The invitation function authenticates the caller and checks organizers before
-- administering Club accounts. These grants apply only to the server role.
grant select on public.organizers, public.events to service_role;
grant select, insert, update on public.club_accounts to service_role;
commit;
