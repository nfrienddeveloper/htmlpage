#!/usr/bin/env bash
#
# modernize.sh — one-step local launcher for the php-modernize power tool.
#
# Run it from INSIDE the PHP project you want to modernize:
#
#   /path/to/php-modernizer-mcp/modernize.sh src --php 8.3            # dry-run
#   /path/to/php-modernizer-mcp/modernize.sh src --php 8.3 --apply    # write
#   /path/to/php-modernizer-mcp/modernize.sh --setup                 # install PHP tools here
#
# It builds itself on first use and targets your current directory automatically.
set -euo pipefail

# Resolve the directory this script lives in (the php-modernizer-mcp package).
SELF="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(pwd)"

# --- one-time: install PHP dev toolchain into the target project ----------------
if [[ "${1:-}" == "--setup" ]]; then
  echo "Installing Rector / PHP-CS-Fixer / PHPStan into ${PROJECT_DIR} ..."
  composer require --dev rector/rector friendsofphp/php-cs-fixer phpstan/phpstan
  echo "Done. Now run: $(basename "${BASH_SOURCE[0]}") <path> [--php 8.3] [--apply]"
  exit 0
fi

# --- build the tool if needed ---------------------------------------------------
if [[ ! -f "${SELF}/dist/cli.js" || "${SELF}/src/cli.ts" -nt "${SELF}/dist/cli.js" ]]; then
  echo "Building php-modernize (first run) ..."
  ( cd "${SELF}" && [[ -d node_modules ]] || npm install --silent )
  ( cd "${SELF}" && npm run build --silent )
fi

if [[ $# -eq 0 ]]; then
  echo "Usage: $(basename "${BASH_SOURCE[0]}") <path> [--php 8.3] [--apply] [--skip-tests]"
  echo "       $(basename "${BASH_SOURCE[0]}") --setup    # install PHP tools in this project"
  exit 1
fi

# --- run, targeting the current directory ---------------------------------------
PHP_MODERNIZER_PROJECT_DIR="${PROJECT_DIR}" exec node "${SELF}/dist/cli.js" "$@"
