-- Newer Supabase projects no longer grant table privileges to the API roles
-- automatically. Grant exactly what the RLS policies in the init migration allow.

-- server (quotas, inserts, caching, account deletion) uses the service role
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on public.profiles, public.projects, public.analysis_cache to service_role;

-- signed-in users: only what their row-level policies permit
grant select, update on public.profiles to authenticated;
grant select, update, delete on public.projects to authenticated;

-- anonymous visitors and the cache: no direct access
revoke all on public.profiles, public.projects, public.analysis_cache from anon;
revoke all on public.analysis_cache from authenticated;
