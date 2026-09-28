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
  token: z.string({ required_error: "Token wajib disertakan" }).min(1),
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
