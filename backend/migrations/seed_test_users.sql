-- ============================================
-- Test accounts for development
-- Run after Docker services are up:
--   docker exec aishot-postgres psql -U aishot -d aishot -f /docker-entrypoint-initdb.d/seed_test_users.sql
-- Or directly:
--   docker exec -i aishot-postgres psql -U aishot -d aishot < backend/migrations/seed_test_users.sql
-- ============================================

-- Admin account (email: admin@aishot.io  /  password: Admin1234!)
INSERT INTO users (email, nickname, password_hash, role, status, created_at, updated_at)
VALUES (
    'admin@aishot.io',
    'Admin',
    '$2b$12$XNB9xchOvzdj5onxdUPAKuRyq2OtfwWbPje0sqWn0xzlaGGRU1Fzi',
    'superadmin',
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Regular test user (email: test@aishot.io  /  password: Test1234!)
INSERT INTO users (email, nickname, password_hash, role, status, created_at, updated_at)
VALUES (
    'test@aishot.io',
    'TestUser',
    '$2b$12$qmTLsjPTjQcUV.GWnAuyQe7otJLU6.KckcUF8G0HLEeZt1cCeBgAW',
    'user',
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;
