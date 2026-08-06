#!/bin/sh
set -e
if [ -z "${DISPLAY:-}" ]; then
  export DISPLAY=:99
fi
display_num="${DISPLAY#:}"
if ! pgrep -x Xvfb >/dev/null 2>&1; then
  rm -f "/tmp/.X${display_num}-lock" 2>/dev/null || true
  Xvfb "${DISPLAY}" -screen 0 1280x720x24 -ac +extension GLX +render -noreset &
  sleep 1
fi
exec /app/.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8090 --loop asyncio
