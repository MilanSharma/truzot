/**
 * Mock utilities for external services to avoid API costs during testing
 */

import { vi } from "vitest";

// Mock Fal.ai
export const mockFalQueue = {
  submit: vi.fn().mockResolvedValue({
    request_id: "test-request-id",
    status: "IN_QUEUE",
  }),
  status: vi.fn().mockResolvedValue({
    status: "COMPLETED",
    logs: [],
  }),
};

export const mockFalRun = vi.fn().mockResolvedValue({
  images: [
    {
      url: "https://example.com/test-image-1.jpg",
      seed: 123,
    },
    {
      url: "https://example.com/test-image-2.jpg",
      seed: 124,
    },
  ],
});

// Mock Stripe
export const mockStripeCheckoutSessions = {
  create: vi.fn().mockResolvedValue({
    url: "https://checkout.stripe.com/test-session-id",
    id: "cs_test_123",
  }),
};

export const mockStripePaymentIntents = {
  retrieve: vi.fn().mockResolvedValue({
    id: "pi_test_123",
    status: "succeeded",
    amount: 2900,
    latest_charge: "ch_test_123",
  }),
};

export const mockStripeRefunds = {
  create: vi.fn().mockResolvedValue({
    id: "re_test_123",
    amount: 2900,
  }),
  list: vi.fn().mockResolvedValue({
    data: [],
  }),
};

export const mockStripe = {
  checkout: {
    sessions: mockStripeCheckoutSessions,
  },
  paymentIntents: mockStripePaymentIntents,
  refunds: mockStripeRefunds,
  webhooks: {
    constructEvent: vi.fn((payload, signature, secret) => ({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          payment_intent: "pi_test_123",
          metadata: {
            order_id: "test-order-id",
          },
        },
      },
    })),
  },
};

// Mock Resend
export const mockResendEmails = {
  send: vi.fn().mockResolvedValue({
    id: "test-email-id",
  }),
};

export const mockResend = {
  emails: mockResendEmails,
};

// Mock Upstash Redis for rate limiting
export const mockRatelimit = {
  limit: vi.fn().mockResolvedValue({
    success: true,
    limit: 10,
    remaining: 9,
    reset: Date.now() + 60000,
  }),
};

// Mock Supabase Storage
export const mockStorageUpload = vi.fn().mockResolvedValue({
  path: "test-uploads/test-file.jpg",
  fullPath: "test-uploads/test-file.jpg",
});

export const mockStorageDownload = vi.fn().mockResolvedValue({
  signedUrl: "https://example.com/signed-url",
});

// Helper to reset all mocks
export function resetAllMocks() {
  mockFalQueue.submit.mockClear();
  mockFalQueue.status.mockClear();
  mockFalRun.mockClear();
  mockStripeCheckoutSessions.create.mockClear();
  mockStripePaymentIntents.retrieve.mockClear();
  mockStripeRefunds.create.mockClear();
  mockStripeRefunds.list.mockClear();
  mockResendEmails.send.mockClear();
  mockRatelimit.limit.mockClear();
  mockStorageUpload.mockClear();
  mockStorageDownload.mockClear();
}
