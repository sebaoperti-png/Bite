#!/usr/bin/env bash
# Runs the database security tests against a throwaway local PostgreSQL 16.
# Usage: PGHOST=/tmp/pg PGPORT=5499 PGUSER=postgres supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
P="psql -q -t -v ON_ERROR_STOP=1"
$P -c "set client_min_messages = warning" -c "drop database if exists bite_test" -c "create database bite_test" >/dev/null
$P -d bite_test -f supabase/tests/supabase_shim.sql >/dev/null 2>&1 || true
for f in supabase/migrations/*.sql; do case "$f" in *_storage.sql) continue;; esac; $P -d bite_test -f "$f" >/dev/null; done
$P -d bite_test -f supabase/tests/rls_test.sql 2>&1 | grep -E "ok |FAIL|PASSED|ERROR" | sed 's/^psql:[^ ]* NOTICE:  //'
