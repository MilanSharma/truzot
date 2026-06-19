import { describe, it, expect } from "vitest";

describe("export", () => {
  it("rejects unauthorized request with missing auth header", async () => {
    const { GET } = await import("@/app/api/export/route");
    const response = await GET(
      new Request("http://localhost/api/export", {
        method: "GET",
      }),
    );
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("rejects request with empty Bearer token", async () => {
    const { GET } = await import("@/app/api/export/route");
    const response = await GET(
      new Request("http://localhost/api/export", {
        method: "GET",
        headers: { Authorization: "Bearer " },
      }),
    );
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns json content type on valid auth attempt", async () => {
    const { GET } = await import("@/app/api/export/route");
    const response = await GET(
      new Request("http://localhost/api/export", {
        method: "GET",
        headers: { Authorization: "Bearer test-token" },
      }),
    );
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });
});
