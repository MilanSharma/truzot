-- Step-level funnel instrumentation for /upload.
--
-- Why: 9 visitors reached /upload since Aug 3 and zero of them created even a
-- `pending` order (which /api/checkout inserts the moment someone clicks
-- "Continue to Payment"). So 100% of paid-flow traffic quits somewhere between
-- landing and checkout, and nothing currently records WHERE. The existing
-- fbq/gtag calls in upload/page.tsx fire at only two points, are routinely
-- blocked by ad blockers, and aren't queryable from here anyway.
--
-- Deliberately anonymous: no email, no user id, no IP, no photo data. The
-- session_id is a random per-tab value generated client-side purely to stitch
-- steps of one visit into a funnel; it identifies nobody and is never joined
-- to auth.users, orders, or waitlist.

create table if not exists public.funnel_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  session_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Funnel queries are always "recent events, grouped by step".
create index if not exists funnel_events_created_at_idx
  on public.funnel_events (created_at desc);
create index if not exists funnel_events_event_created_at_idx
  on public.funnel_events (event, created_at desc);
create index if not exists funnel_events_session_idx
  on public.funnel_events (session_id);

alter table public.funnel_events enable row level security;

-- No client-side policies on purpose: writes go exclusively through
-- /api/track-funnel using the service role, which validates the event name
-- against an allowlist. Nothing in the browser can read or write this table
-- directly, so it can't be scraped or poisoned with arbitrary rows.
