#!/bin/bash
set -e

echo "=== Truzot Pre-Deploy Verification ==="
echo ""
PASS=0
FAIL=0

check() {
  local name="$1"
  shift
  echo -n "  [$name] ... "
  if "$@" > /tmp/truzot-check.log 2>&1; then
    echo "PASS"
    PASS=$((PASS + 1))
  else
    echo "FAIL"
    FAIL=$((FAIL + 1))
    tail -5 /tmp/truzot-check.log
  fi
}

echo "Running checks..."

check "Unit Tests" npx vitest run
check "TypeScript Build" npx next build

echo ""
echo "Results: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  echo "FAILURE: Some checks did not pass."
  exit 1
fi
echo "SUCCESS: All checks passed!"
