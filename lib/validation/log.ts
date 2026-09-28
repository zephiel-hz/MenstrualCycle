import { z } from "zod";

export const flowEnum = z.enum(["none", "light", "medium", "heavy"], {
  errorMap: () => ({ message: "Pilihan aliran darah tidak valid" }),
});

export const ALLOWED_MOODS = [
  "senang",
  "baik",
  "netral",
  "sedih",
  "stres",
  "mudah_marah",
  "cemas",
  "berenergi",
] as const;

export const ALLOWED_SYMPTOMS = [
  "kram",
  "sakit_kepala",
  "kembung",
  "jerawat",
  "nyeri_punggung",
  "lelah",
  "mual",
  "payudara_sensitif",
  "insomnia",
  "nafsu_makan_naik",
] as const;

export const dailyLogSchema = z.object({
  date: z
    .string({ required_error: "Tanggal wajib diisi" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Format tanggal harus YYYY-MM-DD" }),
  flow: flowEnum.default("none"),
  mood: z.array(z.string().max(50)).max(20).default([]),
  symptoms: z.array(z.string().max(50)).max(30).default([]),
  notes: z.string().max(2000, { message: "Catatan maksimal 2000 karakter" }).optional().nullable(),
});
