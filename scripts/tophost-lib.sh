# Funcții comune pentru deploy-tophost.sh și rollback-tophost.sh (se include cu `source`).
# Nu conține secrete. Conexiunea SSH folosește blocul `Host tophost-parintel` din ~/.ssh/config.

SSH_HOST="${TOPHOST_SSH_HOST:-tophost-parintel}"
SERVER_IP="${TOPHOST_IP:-195.178.106.95}"
SITE_HOST="${TOPHOST_SITE_HOST:-parintelemarin.com}"
REMOTE_BASE='~/parohie'

log() { printf '\033[1m[tophost]\033[0m %s\n' "$*" >&2; }
die() { printf '\033[31m[tophost] EROARE:\033[0m %s\n' "$*" >&2; exit 1; }

# Rulează o comandă pe server, cu locale C și verificarea contului (whoami = parintel).
remote() {
  ssh -o BatchMode=yes -o ConnectTimeout=15 -o SendEnv=-LANG -o SendEnv=-LC_\* "$SSH_HOST" \
    "export LC_ALL=C LANG=C; [ \"\$(whoami)\" = parintel ] || { echo 'whoami != parintel, abandon' >&2; exit 97; }; $1" \
    2> >(grep -vE '^perl: warning|^	|are supported and installed|Falling back to the standard locale' >&2)
}

restart_app() {
  remote "mkdir -p $REMOTE_BASE/tmp && touch $REMOTE_BASE/tmp/restart.txt"
}

# Smoke test prin HTTPS, fixat pe IP-ul serverului (--resolve, independent de DNS); reîncearcă până la $1 secunde (implicit 60).
smoke_test() {
  local timeout="${1:-60}" start now body
  start=$(date +%s)
  while :; do
    if body=$(curl -fsS --max-time 10 --resolve "$SITE_HOST:443:$SERVER_IP" "https://$SITE_HOST/api/health" 2>/dev/null) \
       && [ "$body" = '{"ok":true}' ]; then
      now=$(date +%s); log "health OK după $((now - start)) s"
      return 0
    fi
    now=$(date +%s)
    [ $((now - start)) -ge "$timeout" ] && { log "health a eșuat după ${timeout} s"; return 1; }
    sleep 2
  done
}
