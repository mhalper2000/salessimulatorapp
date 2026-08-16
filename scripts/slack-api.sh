#!/usr/bin/env bash
# Read/post Slack messages using browser session tokens from .env (no Slack app).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

: "${SLACK_TOKEN:?Set SLACK_TOKEN in .env — run ./scripts/slack-browser-setup.sh}"
: "${SLACK_D_COOKIE:?Set SLACK_D_COOKIE in .env — run ./scripts/slack-browser-setup.sh}"
SLACK_CHANNEL="${SLACK_CHANNEL:-C0A72HHM7RU}"

slack_api() {
  local endpoint="$1"
  shift
  curl -sf "$endpoint" \
    -H "Authorization: Bearer ${SLACK_TOKEN}" \
    -H "Cookie: d=${SLACK_D_COOKIE}" \
    -H "Content-Type: application/json; charset=utf-8" \
    "$@"
}

cmd="${1:-}"
shift || true

case "$cmd" in
  history)
    limit="${1:-20}"
    response="$(slack_api "https://slack.com/api/conversations.history?channel=${SLACK_CHANNEL}&limit=${limit}")"
    if ! echo "$response" | jq -e '.ok' >/dev/null 2>&1; then
      echo "$response" | jq '.' >&2 || echo "$response" >&2
      exit 1
    fi
    echo "$response" | jq -r '.messages[] | "\(.ts | split(".")[0] | tonumber | strftime("%Y-%m-%d %H:%M")) \(.user // "bot"): \(.text // "[no text]")"' | tail -r
    ;;
  post)
    text="${*:-}"
    if [[ -z "$text" ]]; then
      echo "Usage: $0 post \"message text\"" >&2
      exit 1
    fi
    payload="$(jq -n --arg channel "$SLACK_CHANNEL" --arg text "$text" '{channel: $channel, text: $text}')"
    response="$(slack_api "https://slack.com/api/chat.postMessage" -d "$payload")"
    if ! echo "$response" | jq -e '.ok' >/dev/null 2>&1; then
      echo "$response" | jq '.' >&2 || echo "$response" >&2
      exit 1
    fi
    echo "Posted to ${SLACK_CHANNEL}"
    ;;
  test)
    response="$(slack_api "https://slack.com/api/auth.test")"
    echo "$response" | jq '.'
    ;;
  *)
    echo "Usage: $0 {history|post|test} [args...]" >&2
    echo "  history [limit]   — fetch recent channel messages (default 20)" >&2
    echo "  post \"text\"       — post a message to SLACK_CHANNEL" >&2
    echo "  test              — verify tokens with auth.test" >&2
    exit 1
    ;;
esac
