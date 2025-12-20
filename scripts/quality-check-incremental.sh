#!/bin/bash
# Incremental code quality check (only changed files)
# Usage: ./scripts/quality-check-incremental.sh [base-ref]

set -e

BASE_REF="${1:-HEAD}"
CONFIG_FILE="${2:-.code-quality-config.json}"

echo "Running incremental scan against $BASE_REF..."

if [ -f "$CONFIG_FILE" ]; then
  software-entropy . --incremental --base-ref "$BASE_REF" --config "$CONFIG_FILE"
else
  software-entropy . --incremental --base-ref "$BASE_REF"
fi

