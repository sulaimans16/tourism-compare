-- Server-side secrets live in Supabase Vault (Dashboard -> Database -> Vault).
-- node-api and java-pricing call this RPC with the service-role key at startup, so the hosting
-- platform only needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY. Env vars still override Vault.
create or replace function public.get_app_secrets()
returns table (name text, value text)
language sql
security definer
set search_path = ''
stable
as $$
  select s.name, s.decrypted_secret
  from vault.decrypted_secrets s
  where s.name in ('SERPAPI_API_KEY', 'GOOGLE_MAPS_API_KEY', 'PRICING_SERVICE_TOKEN', 'REDIRECT_SIGNING_SECRET');
$$;

revoke all on function public.get_app_secrets() from public, anon, authenticated;
grant execute on function public.get_app_secrets() to service_role;

-- Internal secrets nobody needs to type: generated once, kept if they already exist.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'PRICING_SERVICE_TOKEN') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'PRICING_SERVICE_TOKEN',
      'Shared secret between node-api and java-pricing (X-Service-Token)');
  end if;
  if not exists (select 1 from vault.secrets where name = 'REDIRECT_SIGNING_SECRET') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'REDIRECT_SIGNING_SECRET',
      'HMAC key for signed /go redirect links');
  end if;
end $$;
