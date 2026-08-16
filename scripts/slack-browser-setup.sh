#!/usr/bin/env bash
# Extract Slack browser session tokens for the dev agent (no Slack app required).
# Writes SLACK_TOKEN + SLACK_D_COOKIE to .env in the repo root.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env"
CHANNEL_ID="${SLACK_CHANNEL:-C0A72HHM7RU}"

echo "Salescripter — Slack browser token setup"
echo "========================================="
echo ""
echo "You need two values from a logged-in Slack session in Chrome/Edge:"
echo ""
echo "1. xoxc token (SLACK_TOKEN)"
echo "   - Open https://app.slack.com/client in your browser"
echo "   - DevTools → Application → Local Storage → https://app.slack.com"
echo "   - Find a key like 'localConfig_v2' or search for 'xoxc-'"
echo "   - Or: Network tab → any api.slack.com request → Request headers → authorization: Bearer xoxc-..."
echo ""
echo "2. d cookie (SLACK_D_COOKIE)"
echo "   - DevTools → Application → Cookies → https://app.slack.com"
echo "   - Copy the value of the cookie named 'd' (starts with xoxd-)"
echo ""
echo "These expire when your browser session ends. Never commit them to git."
echo ""

read -rsp "Paste xoxc token (SLACK_TOKEN): " SLACK_TOKEN
echo ""
read -rsp "Paste d cookie value (SLACK_D_COOKIE): " SLACK_D_COOKIE
echo ""

if [[ -z "$SLACK_TOKEN" || -z "$SLACK_D_COOKIE" ]]; then
  echo "Error: both values are required." >&2
  exit 1
fi

if [[ "$SLACK_TOKEN" != xoxc-* ]]; then
  echo "Warning: SLACK_TOKEN usually starts with xoxc-" >&2
fi

touch "$ENV_FILE"

upsert_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    # Portable in-place replace (macOS sed)
    sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

upsert_env "SLACK_TOKEN" "$SLACK_TOKEN"
upsert_env "SLACK_D_COOKIE" "$SLACK_D_COOKIE"
upsert_env "SLACK_CHANNEL" "$CHANNEL_ID"

echo ""
echo "Saved to $ENV_FILE (gitignored)."
echo "Test with: ./scripts/slack-api.sh history 5"
echo "Post with:  ./scripts/slack-api.sh post \"Your message here\""
