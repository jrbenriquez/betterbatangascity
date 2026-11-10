#!/bin/bash
# Compatibility entry point for the static build; no version changes or network access.
set -euo pipefail
cd "$(dirname "$0")"
node scripts/build-static.js
