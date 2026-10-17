#!/usr/bin/env bash
# Rollback pe TopHost: schimbă app ↔ app.prev, restart, smoke test.
# Rulat de două ori revine la versiunea inițială.
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/tophost-lib.sh

log "swap app ↔ app.prev"
remote "set -e; cd $REMOTE_BASE; [ -d app ] && [ -d app.prev ] || { echo 'lipsește app sau app.prev' >&2; exit 1; }; \
  rm -rf app.swap; mv app app.swap; mv app.prev app; mv app.swap app.prev; \
  echo \"activ: \$(cat app/REVISION 2>/dev/null || echo ?)\" >&2; touch tmp/restart.txt"
smoke_test 60 || die "health eșuează după rollback"
log "rollback reușit"
