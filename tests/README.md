# Truzot Test Suite

This directory contains the comprehensive test suite for the Truzot AI Headshots SaaS application. The test suite includes unit tests, integration tests, and end-to-end (E2E) tests to ensure 300% confidence in the application's readiness for paid users.

## Test Structure

```
tests/
├── mocks/              # Mock utilities for external services
│   └── external-services.ts
├── seed.ts             # Database seed script for test data
├── setup.ts            # Vitest setup file
├── unit/               # Unit tests
│   ├── validations.test.ts
│   └── business-logic.test.ts
└── api/                # Integration tests
    ├── auth.test.ts
    ├── upload.test.ts
    ├── checkout.test.ts
    ├── webhooks-stripe.test.ts
    ├── generate.test.ts
    ├── orders.test.ts
    └── headshots.test.ts

e2e/                   # E2E tests (Playwright)
├── auth.spec.ts
├── free-generation.spec.ts
├── paid-checkout.spec.ts
├── dashboard.spec.ts
├── account.spec.ts
├── team.spec.ts
├── admin.spec.ts
└── seo.spec.ts
```

## Testing Tools

- **Vitest**: Unit and integration tests
- **Playwright**: End-to-end tests
- **Supabase**: Local database instance for testing

## Running Tests

### Prerequisites

1. Start the local Supabase instance:
```bash
supabase start
```

2. Install dependencies:
```bash
npm install
```

### Unit & Integration Tests

Run all unit and integration tests:
```bash
npm run test:run
```

Run tests in watch mode:
```bash
npm run test
```

Run with coverage:
```bash
npm run test:coverage
```

### E2E Tests

Run all E2E tests:
```bash
npx playwright test
```

Run E2E tests in headed mode (with browser UI):
```bash
npx playwright test --headed
```

Run specific E2E test file:
```bash
npx playwright test e2e/auth.spec.ts
```

### Database Seeding

To populate the local Supabase instance with test data:
```bash
npx tsx tests/seed.ts
```

## Test Environment Variables

The following environment variables are configured in `tests/setup.ts`:

- `NEXT_PUBLIC_SUPABASE_URL`: Local Supabase URL (default: `http://localhost:54321`)
- `SUPABASE_SERVICE_ROLE_KEY`: Test service role key
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Test anon key
- `STRIPE_SECRET_KEY`: Test Stripe key
- `STRIPE_WEBHOOK_SECRET`: Test webhook secret
- `FAL_KEY`: Mock Fal.ai key
- `FAL_WEBHOOK_SECRET`: Mock Fal webhook secret
- `CRON_SECRET`: Test cron secret
- `RESEND_API_KEY`: Mock Resend key
- `NEXT_PUBLIC_SITE_URL`: Local site URL (default: `http://localhost:3000`)
- `TEST_MODE`: Set to `true` for test mode

## Mocking External Services

All external services are mocked to ensure zero-cost testing:

- **Fal.ai**: Mocked in `tests/mocks/external-services.ts`
- **Stripe**: Mocked for payment operations
- **Resend**: Mocked for email operations
- **Upstash Redis**: Mocked for queue operations

## Test Coverage

### Unit Tests

- Validation schemas (Zod)
- Business logic (PLANS, isValidTransition, helpers)

### Integration Tests

- Authentication endpoints (signup, reset-password, sign-in)
- Upload endpoints
- Checkout and payment endpoints
- Stripe webhook endpoint
- Generation and training endpoints
- Order management endpoints
- Headshot operations endpoints
- User account endpoints

### E2E Tests

- Free headshot generation journey
- Full paid checkout journey
- Dashboard management
- Account management
- Team workspace
- Admin dashboard
- SEO pages and error handling

## CI/CD

Tests are automatically run on GitHub Actions for pushes and pull requests to `main` and `develop` branches. See `.github/workflows/test.yml` for the CI configuration.

## Best Practices

1. **Zero-cost**: All tests use mocked external services to avoid API charges
2. **Fast**: Tests are designed to complete within 10 minutes
3. **Reliable**: Tests use consistent seed data and proper cleanup
4. **Maintainable**: Tests are organized by feature and follow clear patterns

## Adding New Tests

When adding new tests:

1. Place unit tests in `tests/unit/`
2. Place integration tests in `tests/api/`
3. Place E2E tests in `e2e/`
4. Update the seed script if new test data is needed
5. Add mocks for any new external services in `tests/mocks/external-services.ts`

## Troubleshooting

### Supabase Connection Issues

If tests fail due to Supabase connection:
```bash
supabase stop
supabase start
```

### Port Conflicts

If port 54321 is in use:
```bash
supabase stop
# Change port in supabase/config.toml
supabase start
```

### Playwright Browser Issues

If E2E tests fail due to browser issues:
```bash
npx playwright install --with-deps
```
