import { describe, it, expect } from "vitest";

describe("uploadActionSchema", () => {
  it("validates get-upload-url action", async () => {
    const { uploadActionSchema, validate } = await import("@/lib/validations");
    const result = validate(uploadActionSchema, {
      action: "get-upload-url",
    });
    expect(result.error).toBeUndefined();
    expect(result.data?.action).toBe("get-upload-url");
  });

  it("validates get-download-url action with path", async () => {
    const { uploadActionSchema, validate } = await import("@/lib/validations");
    const result = validate(uploadActionSchema, {
      action: "get-download-url",
      path: "uploads/test.zip",
    });
    expect(result.error).toBeUndefined();
    expect(result.data?.path).toBe("uploads/test.zip");
  });

  it("validates check action with path and filename", async () => {
    const { uploadActionSchema, validate } = await import("@/lib/validations");
    const result = validate(uploadActionSchema, {
      action: "check",
      path: "uploads/test.zip",
      filename: "test.zip",
    });
    expect(result.error).toBeUndefined();
    expect(result.data?.action).toBe("check");
    expect(result.data?.path).toBe("uploads/test.zip");
    expect(result.data?.filename).toBe("test.zip");
  });

  it("rejects invalid action", async () => {
    const { uploadActionSchema, validate } = await import("@/lib/validations");
    const result = validate(uploadActionSchema, {
      action: "invalid-action",
    });
    expect(result.error).toBeDefined();
    expect(result.error).toContain("action");
  });

  it("rejects missing action", async () => {
    const { uploadActionSchema, validate } = await import("@/lib/validations");
    const result = validate(uploadActionSchema, {});
    expect(result.error).toBeDefined();
    expect(result.error).toContain("action");
  });

  it("rejects empty action string", async () => {
    const { uploadActionSchema, validate } = await import("@/lib/validations");
    const result = validate(uploadActionSchema, {
      action: "",
    });
    expect(result.error).toBeDefined();
    expect(result.error).toContain("action");
  });

  it("accepts get-upload-url without filename or path", async () => {
    const { uploadActionSchema, validate } = await import("@/lib/validations");
    const result = validate(uploadActionSchema, {
      action: "get-upload-url",
    });
    expect(result.error).toBeUndefined();
    expect(result.data?.filename).toBeUndefined();
    expect(result.data?.path).toBeUndefined();
  });
});

describe("upload route handler", () => {
  it("rejects invalid action", async () => {
    const { POST } = await import("@/app/api/upload/route");
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ action: "invalid" }),
      }),
    );
    const data = await response.json() as { error?: string };
    expect(response.status).toBe(400);
    expect(data.error).toContain("action");
  }, 10000);

  it("rejects missing action", async () => {
    const { POST } = await import("@/app/api/upload/route");
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    const data = await response.json() as { error?: string };
    expect(response.status).toBe(400);
    expect(data.error).toContain("action");
  }, 10000);

  it("rejects get-download-url with missing path", async () => {
    const { POST } = await import("@/app/api/upload/route");
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ action: "get-download-url" }),
      }),
    );
    const data = await response.json() as { error?: string };
    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid path");
  }, 10000);

  it("rejects check action with missing path", async () => {
    const { POST } = await import("@/app/api/upload/route");
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ action: "check" }),
      }),
    );
    const data = await response.json() as { error?: string };
    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid path");
  }, 10000);

  it("rejects path with traversal", async () => {
    const { POST } = await import("@/app/api/upload/route");
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          action: "check",
          path: "../etc/passwd",
        }),
      }),
    );
    const data = await response.json() as { error?: string };
    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid path");
  }, 10000);

  it("rejects absolute path", async () => {
    const { POST } = await import("@/app/api/upload/route");
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          action: "check",
          path: "/etc/passwd",
        }),
      }),
    );
    const data = await response.json() as { error?: string };
    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid path");
  }, 10000);

  it("rejects path with disallowed characters", async () => {
    const { POST } = await import("@/app/api/upload/route");
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          action: "check",
          path: "uploads/invalid space path.zip",
        }),
      }),
    );
    const data = await response.json() as { error?: string };
    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid path");
  }, 10000);
});
