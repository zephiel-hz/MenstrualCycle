import { z } from "zod";

export const userSettingsSchema = z.object({
  reminderPeriod: z.boolean().default(true),
  reminderLogging: z.boolean().default(true),
  reminderSymptoms: z.boolean().default(false),
  reminderPms: z.boolean().default(true),
  cycleLengthDefault: z
    .number()
    .int()
    .min(15, { message: "Panjang siklus minimal 15 hari" })
    .max(60, { message: "Panjang siklus maksimal 60 hari" })
    .default(28),
  periodDurationDefault: z
    .number()
    .int()
    .min(1, { message: "Durasi menstruasi minimal 1 hari" })
    .max(20, { message: "Durasi menstruasi maksimal 20 hari" })
    .default(5),
});
