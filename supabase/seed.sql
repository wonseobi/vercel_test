-- test users login with password: password123

create or replace function public._seed_user(p_email text, p_password text)
returns uuid
language plpgsql
as $$
declare
  uid uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', p_email,
    crypt(p_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}',
    now(), now()
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), uid,
    jsonb_build_object('sub', uid::text, 'email', p_email),
    'email', uid::text, now(), now(), now()
  );

  return uid;
end;
$$;

do $$
declare
  free_id    uuid := public._seed_user('free@example.com',    'password123');
  premium_id uuid := public._seed_user('premium@example.com', 'password123');
  beta_id    uuid := public._seed_user('beta@example.com',    'password123');
begin
  update public.profiles set account_tier = 'free'    where id = free_id;
  update public.profiles set account_tier = 'premium' where id = premium_id;
  update public.profiles set account_tier = 'beta'    where id = beta_id;
end $$;

insert into public.feature_flags (key, name, description, enabled, required_tier, environment) values
  ('new_onboarding',    'New Onboarding',     'Redesigned first-run experience.',     true,  'free',    'all'),
  ('dark_mode',         'Dark Mode',          'System-wide dark theme.',              true,  'free',    'all'),
  ('premium_analytics', 'Premium Analytics',  'Advanced usage dashboards.',           true,  'premium', 'all'),
  ('priority_support',  'Priority Support',   'Front-of-queue support routing.',      false, 'premium', 'all'),
  ('beta_ai_assistant', 'Beta AI Assistant',  'Experimental in-app AI helper.',       true,  'beta',    'all'),
  ('beta_new_editor',   'Beta Editor',        'Next-gen editor, staging only.',       true,  'beta',    'staging'),
  ('prod_rollout_demo', 'Production Rollout', 'Flag that only exists in production.', true,  'free',    'production');

drop function public._seed_user(text, text);
