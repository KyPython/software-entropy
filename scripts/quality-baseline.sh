#!/bin/bash
# Create or update baseline for code quality
# Usage: ./scripts/quality-baseline.sh

set -e

BASELINE_FILE="${1:-.code-quality-baseline.json}"
CONFIG_FILE="${2:-.code-quality-config.json}"

echo "Creating baseline: $BASELINE_FILE"

if [ -f "$CONFIG_FILE" ]; then
  software-entropy . --save-baseline "$BASELINE_FILE" --config "$CONFIG_FILE"
else
  software-entropy . --save-baseline "$BASELINE_FILE"
fi

echo "Baseline saved to $BASELINE_FILE"

