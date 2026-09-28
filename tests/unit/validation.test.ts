import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema, deleteAccountSchema } from "@/lib/validation/auth";
import { createCycleSchema } from "@/lib/validation/cycle";
import { dailyLogSchema } from "@/lib/validation/log";

describe("Zod Validation Schemas", () => {
  it("should validate valid registration inputs", () => {
    const result = registerSchema.safeParse({
      email: "User@example.com",
      password: "password123",
      displayName: "Dewi",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("should reject short passwords and invalid emails", () => {
    const shortPwd = registerSchema.safeParse({
      email: "test@example.com",
      password: "123",
    });
    expect(shortPwd.success).toBe(false);

    const invalidEmail = registerSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(invalidEmail.success).toBe(false);
  });

  it("should validate cycle dates and reject endDate < startDate", () => {
    const valid = createCycleSchema.safeParse({
      startDate: "2026-09-01",
      endDate: "2026-09-06",
    });
    expect(valid.success).toBe(true);

    const invalidDates = createCycleSchema.safeParse({
      startDate: "2026-09-10",
      endDate: "2026-09-05",
    });
    expect(invalidDates.success).toBe(false);
  });

  it("should validate daily logs and enforce flow types", () => {
    const validLog = dailyLogSchema.safeParse({
      date: "2026-09-28",
      flow: "medium",
      mood: ["senang", "berenergi"],
      symptoms: ["kram"],
      notes: "Hari pertama periode",
    });
    expect(validLog.success).toBe(true);

    const invalidFlow = dailyLogSchema.safeParse({
      date: "2026-09-28",
      flow: "extremely_high",
    });
    expect(invalidFlow.success).toBe(false);
  });

  it("should strictly require exact confirmation text for delete account", () => {
    const valid = deleteAccountSchema.safeParse({
      password: "password123",
      confirmText: "HAPUS AKUN SAYA",
    });
    expect(valid.success).toBe(true);

    const invalid = deleteAccountSchema.safeParse({
      password: "password123",
      confirmText: "hapus akun saya",
    });
    expect(invalid.success).toBe(false);
  });
});
