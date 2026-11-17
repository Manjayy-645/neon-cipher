-- Seed only the rows exercised by Data API/RLS tests. Authentication signup is
-- outside this fixture: the existing signup trigger references an absent
-- safehouses(user_id) unique constraint. Production schema stays unchanged.
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
INSERT INTO auth.users (id) VALUES
('00000000-0000-4000-8000-000000000001'),
('00000000-0000-4000-8000-000000000002');
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
INSERT INTO public.profiles (id, handle) VALUES
('00000000-0000-4000-8000-000000000001', 'CI_RLS_FIXTURE'),
('00000000-0000-4000-8000-000000000002', 'CI_OTHER_USER');
INSERT INTO public.user_settings (user_id) SELECT id FROM auth.users;
-- A non-empty secrets table makes an accidental read permission observable.
INSERT INTO public.game_sessions (id, user_id, node_id) VALUES
('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', 'ci-rls-node');
INSERT INTO public.game_secrets (session_id, secret) VALUES
('00000000-0000-4000-8000-000000000003', '012');
