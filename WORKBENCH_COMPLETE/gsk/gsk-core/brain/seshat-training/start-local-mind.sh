#!/bin/bash
# SESHAT LOCAL MIND — llama-server launcher (Local Mind Phase 1, 2026-10-22)
# Her own keyless Qwen seat on loopback. Rerunnable: if the port is
# already serving, it does nothing. Plain process (no supervisor in
# this VM) — restart by re-running this script; a VM restart kills
# the server and nothing auto-restarts it.
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${SESHAT_LOCAL_PORT:-18222}"
MODEL="$DIR/models/qwen2.5-1.5b-instruct-q4_k_m.gguf"
LOG="$DIR/logs/llama-server.log"
PIDFILE="$DIR/logs/llama-server.pid"

if curl -s --max-time 3 "http://127.0.0.1:$PORT/health" >/dev/null 2>&1; then
    echo "local mind already serving on :$PORT"
    exit 0
fi

cd "$DIR/bin" || exit 1
setsid nohup ./llama-server \
    -m "$MODEL" \
    --host 127.0.0.1 --port "$PORT" \
    --alias qwen2.5-1.5b-instruct-q4_k_m \
    -c 4096 -t 2 --threads-batch 2 \
    >>"$LOG" 2>&1 < /dev/null &
echo $! > "$PIDFILE"
echo "started pid $(cat "$PIDFILE") on :$PORT (log: $LOG)"

for i in $(seq 1 60); do
    if curl -s --max-time 2 "http://127.0.0.1:$PORT/health" >/dev/null 2>&1; then
        echo "healthy after ${i}s"
        exit 0
    fi
    sleep 1
done
echo "WARNING: not healthy after 60s — see $LOG"
exit 1
