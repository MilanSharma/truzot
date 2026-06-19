import { describe, it, expect } from "vitest";

describe("resume checkout", () => {
  it("rejects missing orderId", async () => {
    const { POST } = await import("@/app/api/checkout/resume/route");
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing orderId");
  });

  it("rejects empty orderId string", async () => {
    const { POST } = await import("@/app/api/checkout/resume/route");
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ orderId: "" }),
      }),
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing orderId");
  });

  it("rejects null orderId", async () => {
    const { POST } = await import("@/app/api/checkout/resume/route");
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ orderId: null }),
      }),
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing orderId");
  });

  it("rejects unauthorized request with valid orderId", async () => {
    const { POST } = await import("@/app/api/checkout/resume/route");
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          orderId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      }),
    );
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });
});
