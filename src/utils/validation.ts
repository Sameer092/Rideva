import { z } from "zod";

/** Shared Zod schemas — single source of truth for form + API validation. */

export const emailSchema = z.string().trim().email("Enter a valid email");
export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your name").max(120),
    email: emailSchema,
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number")
      .optional()
      .or(z.literal("")),
    password: passwordSchema,
    role: z.enum(["passenger", "driver"]).default("passenger"),
    vehicleClass: z.enum(["motorcycle", "rickshaw", "economy", "comfort", "xl", "premium"]).default("economy"),
    licensePlate: z.string().trim().max(15).optional().or(z.literal("")),
    vehicleName: z.string().trim().max(40).optional().or(z.literal("")),
  });
export type SignUpValues = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const ratingSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});
export type RatingValues = z.infer<typeof ratingSchema>;

export const savedLocationSchema = z.object({
  label: z.string().trim().min(1).max(60),
  address: z.string().trim().min(1),
});
