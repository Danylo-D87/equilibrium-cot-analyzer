#!/bin/bash
# COT Auto-Update — Cron/Systemd entry point
# Runs the pipeline, checks health, logs everything
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_DIR/backend"
VENV="$PROJECT_DIR/venv/bin/python"
LOG_DIR="$BACKEND_DIR/logs"

mkdir -p "$LOG_DIR"

echo "=========================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] COT Update starting"
echo "=========================================="

cd "$BACKEND_DIR"

# Run auto_update with all passed arguments (e.g. --force)
$VENV auto_update.py "$@"
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Update completed successfully"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Update failed with exit code $EXIT_CODE" >&2
fi

# Run health check
echo ""
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Running health check..."
$VENV data_health_check.py || true

exit $EXIT_CODE
