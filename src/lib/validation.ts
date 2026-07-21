import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().trim().min(1).max(100).optional(),
});

export const babyCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  birthDate: z.coerce.date(),
});

export const babyUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  birthDate: z.coerce.date().optional(),
});

export const feedingCreateSchema = z.object({
  type: z.enum(["BREAST_LEFT", "BREAST_RIGHT", "BOTTLE", "SOLID"]),
  amount: z.coerce.number().positive().optional().nullable(),
  duration: z.coerce.number().positive().optional().nullable(),
  unit: z.enum(["ml", "oz", "min", "hr"]).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  loggedAt: z.coerce.date().optional(),
});

export const feedingUpdateSchema = feedingCreateSchema.partial();

export const diaperCreateSchema = z.object({
  type: z.enum(["WET", "DIRTY", "BOTH", "DRY"]),
  notes: z.string().trim().max(1000).optional().nullable(),
  loggedAt: z.coerce.date().optional(),
  flagged: z.boolean().optional(),
  appointmentId: z.string().optional().nullable(),
});

export const diaperUpdateSchema = diaperCreateSchema.partial();

export const doctorNoteCreateSchema = z.object({
  question: z.string().trim().min(1).max(1000),
  appointmentId: z.string().optional().nullable(),
});

export const doctorNoteUpdateSchema = z.object({
  question: z.string().trim().min(1).max(1000).optional(),
  answered: z.boolean().optional(),
});

export const appointmentCreateSchema = z.object({
  date: z.coerce.date(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const appointmentUpdateSchema = appointmentCreateSchema.partial();

export const inviteCreateSchema = z.object({
  email: z.string().email(),
});

export const photoUpdateSchema = z.object({
  caption: z.string().trim().max(500).optional().nullable(),
  flagged: z.boolean().optional(),
  appointmentId: z.string().optional().nullable(),
});

export const userSettingsSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  theme: z.enum(["stone", "sage", "ocean", "blossom"]).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});
