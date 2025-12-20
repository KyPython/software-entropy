#!/bin/bash
# Code quality check script for Software Entropy
# Usage: ./scripts/quality-check.sh [directory]

set -e

DIRECTORY="${1:-.}"
CONFIG_FILE="${2:-.code-quality-config.json}"

# Check if config exists
if [ -f "$CONFIG_FILE" ]; then
  echo "Using config: $CONFIG_FILE"
  software-entropy "$DIRECTORY" --config "$CONFIG_FILE"
else
  echo "No config file found, using defaults"
  software-entropy "$DIRECTORY"
fi

