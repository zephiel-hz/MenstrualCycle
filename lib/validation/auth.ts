import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .trim()
    .toLowerCase()
    .email({ message: "Format email tidak valid" })
    .max(255, { message: "Email maksimal 255 karakter" }),
  password: z
    .string({ required_error: "Kata sandi wajib diisi" })
    .min(8, { message: "Kata sandi minimal 8 karakter" })
    .max(100, { message: "Kata sandi maksimal 100 karakter" }),
  displayName: z
    .string()
    .trim()
    .max(50, { message: "Nama tampilan maksimal 50 karakter" })
    .optional(),
  timezone: z.string().optional().default("Asia/Jakarta"),
});

export const sendOtpSchema = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .trim()
    .toLowerCase()
    .email({ message: "Format email tidak valid" })
    .max(255, { message: "Email maksimal 255 karakter" }),
  type: z.enum(["register", "forgot_password"], {
    required_error: "Tipe OTP wajib ditentukan",
  }),
  displayName: z.string().trim().optional(),
  password: z.string().min(8).optional(),
});

export const verifyRegisterSchema = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .trim()
    .toLowerCase()
    .email({ message: "Format email tidak valid" }),
  otp: z
    .string({ required_error: "Kode verifikasi 6 digit wajib diisi" })
    .trim()
    .length(6, { message: "Kode verifikasi harus 6 digit angka" })
    .regex(/^\d{6}$/, { message: "Kode verifikasi harus berupa 6 digit angka" }),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .trim()
    .toLowerCase()
    .email({ message: "Format email tidak valid" }),
  password: z
    .string({ required_error: "Kata sandi wajib diisi" })
    .min(1, { message: "Kata sandi wajib diisi" }),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .trim()
    .toLowerCase()
    .email({ message: "Format email tidak valid" }),
});

export const resetPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .trim()
    .toLowerCase()
    .email({ message: "Format email tidak valid" }),
  otp: z
    .string({ required_error: "Kode OTP wajib diisi" })
    .trim()
    .length(6, { message: "Kode verifikasi harus 6 digit angka" })
    .regex(/^\d{6}$/, { message: "Kode verifikasi harus berupa 6 digit angka" }),
  newPassword: z
    .string({ required_error: "Kata sandi baru wajib diisi" })
    .min(8, { message: "Kata sandi minimal 8 karakter" })
    .max(100, { message: "Kata sandi maksimal 100 karakter" }),
});

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(50, { message: "Nama tampilan maksimal 50 karakter" })
    .optional(),
  timezone: z.string().optional(),
});

export const deleteAccountSchema = z.object({
  password: z
    .string({ required_error: "Konfirmasi kata sandi diperlukan" })
    .min(1, { message: "Kata sandi wajib diisi" }),
  confirmText: z
    .literal("HAPUS AKUN SAYA", {
      errorMap: () => ({ message: "Teks konfirmasi tidak sesuai" }),
    }),
});
