#!/bin/bash
set -e

echo "=== Truzot Migration Verification ==="
echo ""

echo "Running: supabase migration list"
echo ""

OUTPUT=$(npx supabase migration list 2>&1)
echo "$OUTPUT"
echo ""

# Check for LOCAL ONLY, REMOTE ONLY, or diverged migrations
LOCAL_ONLY=$(echo "$OUTPUT" | grep -c "LOCAL ONLY" || true)
REMOTE_ONLY=$(echo "$OUTPUT" | grep -c "REMOTE ONLY" || true)

if echo "$OUTPUT" | grep -qi "error\|failed\|not found"; then
  echo "FAILURE: Could not list migrations."
  exit 1
fi

if [ "$LOCAL_ONLY" -gt 0 ] || [ "$REMOTE_ONLY" -gt 0 ]; then
  echo "FAILURE: Migrations are out of sync."
  echo "  Local-only migrations: $LOCAL_ONLY"
  echo "  Remote-only migrations: $REMOTE_ONLY"
  echo "  Run 'supabase db push' or 'supabase migration sync' to resolve."
  exit 1
fi

echo "SUCCESS: All migrations are in sync."
