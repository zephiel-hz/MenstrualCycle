import { describe, it, expect } from "vitest";
import { generateOtp, hashOtp, sendVerificationEmail } from "@/lib/email/service";
import { sendOtpSchema, verifyRegisterSchema, resetPasswordSchema } from "@/lib/validation/auth";

describe("OTP & Email Verification Service", () => {
  it("should generate a 6-digit numeric OTP", () => {
    const otp = generateOtp();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
    const num = Number(otp);
    expect(num).toBeGreaterThanOrEqual(100000);
    expect(num).toBeLessThan(1000000);
  });

  it("should generate consistent sha256 hash for OTP", () => {
    const otp = "123456";
    const hash1 = hashOtp(otp);
    const hash2 = hashOtp(" 123456 ");
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it("should handle sending verification email in dev fallback mode", async () => {
    const result = await sendVerificationEmail({
      email: "test@example.com",
      code: "849201",
      type: "register",
      displayName: "Luna",
    });

    expect(result.success).toBe(true);
    expect(["resend", "smtp", "dev_console"]).toContain(result.method);
  });

  it("should validate sendOtpSchema properly", () => {
    const valid = sendOtpSchema.safeParse({
      email: "user@example.com",
      type: "register",
      password: "password123",
      displayName: "Luna",
    });
    expect(valid.success).toBe(true);

    const invalidEmail = sendOtpSchema.safeParse({
      email: "invalid-email",
      type: "register",
    });
    expect(invalidEmail.success).toBe(false);

    const invalidType = sendOtpSchema.safeParse({
      email: "user@example.com",
      type: "unknown",
    });
    expect(invalidType.success).toBe(false);
  });

  it("should validate verifyRegisterSchema for 6-digit OTP", () => {
    const valid = verifyRegisterSchema.safeParse({
      email: "user@example.com",
      otp: "123456",
    });
    expect(valid.success).toBe(true);

    const invalidOtp = verifyRegisterSchema.safeParse({
      email: "user@example.com",
      otp: "12345", // only 5 digits
    });
    expect(invalidOtp.success).toBe(false);

    const nonNumeric = verifyRegisterSchema.safeParse({
      email: "user@example.com",
      otp: "12ab56",
    });
    expect(nonNumeric.success).toBe(false);
  });

  it("should validate resetPasswordSchema with OTP", () => {
    const valid = resetPasswordSchema.safeParse({
      email: "user@example.com",
      otp: "654321",
      newPassword: "newpassword123",
    });
    expect(valid.success).toBe(true);

    const shortPass = resetPasswordSchema.safeParse({
      email: "user@example.com",
      otp: "654321",
      newPassword: "short",
    });
    expect(shortPass.success).toBe(false);
  });
});
