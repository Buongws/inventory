#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIDS=()

cleanup() {
  echo
  echo "Stopping local services..."
  for pid in "${PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}

require_free_port() {
  local port="$1"
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $port is already in use. Stop its current process before starting the stack."
    exit 1
  fi
}

start_service() {
  local name="$1"
  local directory="$2"
  local command="$3"

  (
    cd "$directory"
    exec bash -lc "$command"
  ) > >(sed -u "s/^/[$name] /") 2>&1 &

  PIDS+=("$!")
}

trap cleanup EXIT INT TERM

require_free_port 3001
require_free_port 3002
require_free_port 3004

echo "Starting API on http://localhost:3001"
echo "Starting Gateway on http://localhost:3004"
echo "Starting Frontend on http://localhost:3002"

start_service "api" "$ROOT_DIR/apps/api" "npm run start:dev"
start_service "gateway" "$ROOT_DIR/apps/gateway" "npm run dev"
start_service "frontend" "$ROOT_DIR/apps/web" "npm run dev"

wait
