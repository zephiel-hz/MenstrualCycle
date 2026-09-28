import { describe, it, expect } from "vitest";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";

describe("Session & Security Guard", () => {
  it("should generate and verify JWT token successfully", async () => {
    const payload = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      email: "test@example.com",
      displayName: "Luna",
    };

    const token = await createSessionToken(payload);
    expect(typeof token).toBe("string");

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.displayName).toBe(payload.displayName);
  });

  it("should return null for invalid or tampered token", async () => {
    const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature";
    const decoded = await verifySessionToken(invalidToken);
    expect(decoded).toBeNull();
  });
});
