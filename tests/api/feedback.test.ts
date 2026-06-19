import { vi, describe, it, expect, beforeEach } from "vitest";

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    auth: { getUser: mockGetUser },
  },
}));

describe("feedback", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "test-user" } },
      error: null,
    });
  });

  it("rejects unauthorized request without auth header", async () => {
    const { POST } = await import("@/app/api/feedback/route");
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("rejects missing orderId", async () => {
    const { POST } = await import("@/app/api/feedback/route");
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { Authorization: "Bearer valid-token" },
        body: JSON.stringify({ imageUrl: "https://example.com/photo.jpg" }),
      }),
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing orderId or imageUrl");
  });

  it("rejects missing imageUrl", async () => {
    const { POST } = await import("@/app/api/feedback/route");
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { Authorization: "Bearer valid-token" },
        body: JSON.stringify({
          orderId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      }),
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing orderId or imageUrl");
  });

  it("rejects missing both orderId and imageUrl", async () => {
    const { POST } = await import("@/app/api/feedback/route");
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { Authorization: "Bearer valid-token" },
        body: JSON.stringify({}),
      }),
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing orderId or imageUrl");
  });

  it("rejects null orderId", async () => {
    const { POST } = await import("@/app/api/feedback/route");
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { Authorization: "Bearer valid-token" },
        body: JSON.stringify({
          orderId: null,
          imageUrl: "https://example.com/photo.jpg",
        }),
      }),
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing orderId or imageUrl");
  });

  it("rejects null imageUrl", async () => {
    const { POST } = await import("@/app/api/feedback/route");
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { Authorization: "Bearer valid-token" },
        body: JSON.stringify({
          orderId: "550e8400-e29b-41d4-a716-446655440000",
          imageUrl: null,
        }),
      }),
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing orderId or imageUrl");
  });
});
