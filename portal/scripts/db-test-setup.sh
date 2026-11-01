#!/usr/bin/env bash
# Checks that TEST_DATABASE_URL points at a reachable PostgreSQL 16+ superuser connection.
# The test run itself creates and drops a throwaway database, applying
# supabase/tests/supabase_shim.sql, every migration, and supabase/seed.sql.
set -euo pipefail
: "${TEST_DATABASE_URL:?Set TEST_DATABASE_URL, for example postgres://postgres:postgres@127.0.0.1:5432/postgres}"
psql "$TEST_DATABASE_URL" -Atc "select 'PostgreSQL ' || current_setting('server_version') || ', superuser: ' || usesuper from pg_user where usename = current_user"
