#!/usr/bin/env bash
# Launcher for Linux / macOS.
set -e
cd "$(dirname "$0")"

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm not found. Install Node.js from https://nodejs.org" >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies (first run)..."
  npm install
fi

echo "Starting Kanban... (Ctrl+C to stop)"
exec npm run dev
