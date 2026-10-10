#!/usr/bin/env bash
# Applies migrations + seed on a throwaway Postgres cluster and runs the SQL tests in supabase/tests/*.test.sql.
# Works without Docker or the Supabase CLI (uses stubs for auth/roles; pgmq/pg_cron/storage are skipped).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
PORT="${PGPORT_TEST:-54329}"
WORK="$(mktemp -d)"
chmod 755 "$WORK"

as_pg() {
  if [ "$(id -u)" = "0" ]; then runuser -u postgres -- "$@"; else "$@"; fi
}
if [ "$(id -u)" = "0" ]; then chown postgres "$WORK"; fi

cleanup() { as_pg "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

as_pg "$PGBIN/initdb" -D "$WORK/data" -U postgres -A trust --locale=C.UTF-8 >/dev/null
as_pg "$PGBIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -l "$WORK/log" -w start >/dev/null

PSQL=("$PGBIN/psql" -h "$WORK" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -t -o /dev/null)
"${PSQL[@]}" -f "$ROOT/tests/stubs.sql"
for f in "$ROOT"/migrations/*.sql; do
  echo "→ $(basename "$f")"
  PGOPTIONS='--client-min-messages=warning' "${PSQL[@]}" -f "$f"
done
PGOPTIONS='--client-min-messages=warning' "${PSQL[@]}" -f "$ROOT/seed.sql"
PGOPTIONS='--client-min-messages=warning' "${PSQL[@]}" -f "$ROOT/seed.sql"   # idempotency
PGOPTIONS='--client-min-messages=warning' "${PSQL[@]}" -f "$ROOT/seed_test.sql"
PGOPTIONS='--client-min-messages=warning' "${PSQL[@]}" -f "$ROOT/seed_test.sql"   # idempotency
echo "→ seed (x2)"
for t in "$ROOT"/tests/*.test.sql; do
  echo "→ $(basename "$t")"
  PGOPTIONS='--client-min-messages=warning' "${PSQL[@]}" -f "$t"
done
echo "✓ database tests passed"
