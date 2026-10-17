#!/usr/bin/env bash
# Deploy pe TopHost: build în GitHub Actions → artefact → upload prin SSH → swap → restart → smoke test.
# Utilizare: scripts/deploy-tophost.sh            (commit-ul curent, HEAD trebuie împins)
#            scripts/deploy-tophost.sh --run <id>   (un run anume al workflow-ului build-standalone)
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/tophost-lib.sh

WORKFLOW=build-standalone.yml
ARTIFACT=parohie-standalone
RUN_ID=''
[ "${1:-}" = '--run' ] && RUN_ID="${2:?lipsește id-ul run-ului}"

if [ -z "$RUN_ID" ]; then
  [ -z "$(git status --porcelain --untracked-files=no)" ] || die "working tree nu e curat (git status)"
  BRANCH=$(git branch --show-current)
  SHA=$(git rev-parse HEAD)
  git fetch -q origin "$BRANCH"
  [ "$(git rev-parse "origin/$BRANCH")" = "$SHA" ] || die "HEAD ($SHA) nu e împins pe origin/$BRANCH"

  # Folosește rularea declanșată de push pentru acest commit; dacă nu există, o declanșează manual.
  for i in $(seq 1 15); do
    RUN_ID=$(gh run list --workflow "$WORKFLOW" --commit "$SHA" --limit 1 --json databaseId --jq '.[0].databaseId // empty')
    [ -n "$RUN_ID" ] && break
    if [ "$i" = 5 ]; then log "niciun run pentru $SHA, declanșez workflow_dispatch"; gh workflow run "$WORKFLOW" --ref "$BRANCH"; fi
    sleep 4
  done
  [ -n "$RUN_ID" ] || die "nu găsesc niciun run $WORKFLOW pentru $SHA"
fi

log "aștept run-ul $RUN_ID"
gh run watch "$RUN_ID" --exit-status --interval 10 >/dev/null || die "run-ul $RUN_ID a eșuat"

TMP=$(mktemp -d "${TMPDIR:-/tmp}/parohie-deploy.XXXXXX")
trap 'rm -rf "$TMP"' EXIT
gh run download "$RUN_ID" --name "$ARTIFACT" --dir "$TMP"
ARCHIVE="$TMP/parohie-standalone.tar.gz"
[ -f "$ARCHIVE" ] || die "artefactul nu conține parohie-standalone.tar.gz"
if tar -tzf "$ARCHIVE" | grep -qE '(^|/)\.env'; then die "arhiva conține fișiere .env*"; fi
REV=$(tar -xzOf "$ARCHIVE" ./REVISION 2>/dev/null || echo necunoscut)
log "upload revizia $REV ($(du -h "$ARCHIVE" | cut -f1))"

# Serverul nu are rsync: extragem într-un app.new gol (echivalent cu rsync --delete).
remote "set -e; rm -rf $REMOTE_BASE/app.new; mkdir -p $REMOTE_BASE/app.new; tar -xzf - -C $REMOTE_BASE/app.new; \
  find $REMOTE_BASE/app.new -type d -exec chmod 755 {} +; find $REMOTE_BASE/app.new -type f -exec chmod 644 {} +; \
  test -f $REMOTE_BASE/app.new/server.js" < "$ARCHIVE"

log "swap app → app.prev, app.new → app"
remote "set -e; cd $REMOTE_BASE; rm -rf app.prev; if [ -d app ]; then mv app app.prev; fi; mv app.new app; mkdir -p tmp; touch tmp/restart.txt"

if smoke_test 60; then
  log "deploy reușit: $REV"
else
  log "smoke test eșuat, rollback automat la app.prev"
  remote "set -e; cd $REMOTE_BASE; [ -d app.prev ] || { echo 'nu există app.prev' >&2; exit 1; }; rm -rf app.failed; mv app app.failed; mv app.prev app; touch tmp/restart.txt"
  smoke_test 60 || log "ATENȚIE: health eșuează și după rollback"
  exit 1
fi
