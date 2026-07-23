import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().trim().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(false),
});

export const babyCreateSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  nickname: z.string().trim().max(50).optional().nullable(),
  birthDate: z.coerce.date(),
  weight: z.coerce.number().positive().optional().nullable(),
  height: z.coerce.number().positive().optional().nullable(),
});

export const babyUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(50).optional(),
  lastName: z.string().trim().min(1).max(50).optional(),
  nickname: z.string().trim().max(50).optional().nullable(),
  birthDate: z.coerce.date().optional(),
  weight: z.coerce.number().positive().optional().nullable(),
  height: z.coerce.number().positive().optional().nullable(),
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

export const vaccinationCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  date: z.coerce.date(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const vaccinationUpdateSchema = vaccinationCreateSchema.partial();

export const growthRecordCreateSchema = z.object({
  type: z.enum(["WEIGHT", "HEIGHT"]),
  value: z.coerce.number().positive(),
  unit: z.enum(["kg", "lb", "cm", "in"]),
  recordedAt: z.coerce.date(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const growthRecordUpdateSchema = growthRecordCreateSchema.partial();

export const healthRecordCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  date: z.coerce.date(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const healthRecordUpdateSchema = healthRecordCreateSchema.partial();

export const inviteCreateSchema = z.object({
  email: z.string().email(),
  babyIds: z.array(z.string().min(1)).min(1),
});

export const photoUpdateSchema = z.object({
  caption: z.string().trim().max(500).optional().nullable(),
});

export const appointmentLinksSchema = z.object({
  appointmentIds: z.array(z.string().min(1)).max(50),
});

export const userSettingsSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  theme: z.enum(["stone", "sage", "ocean", "blossom"]).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});
