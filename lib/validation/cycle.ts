import { z } from "zod";

export const createCycleSchema = z.object({
  startDate: z
    .string({ required_error: "Tanggal mulai wajib diisi" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Format tanggal harus YYYY-MM-DD" }),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Format tanggal harus YYYY-MM-DD" })
    .optional()
    .nullable(),
  notes: z.string().max(1000, { message: "Catatan maksimal 1000 karakter" }).optional().nullable(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
  },
  {
    message: "Tanggal selesai harus sama atau setelah tanggal mulai",
    path: ["endDate"],
  }
);

export const updateCycleSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Format tanggal harus YYYY-MM-DD" })
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Format tanggal harus YYYY-MM-DD" })
    .optional()
    .nullable(),
  notes: z.string().max(1000, { message: "Catatan maksimal 1000 karakter" }).optional().nullable(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
  },
  {
    message: "Tanggal selesai harus sama atau setelah tanggal mulai",
    path: ["endDate"],
  }
);
