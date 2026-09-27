import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "required").email("invalid"),
  password: z.string().min(8, "min"),
});

export const adminSeedEnvSchema = z.object({
  email: z.string().trim().min(1).email(),
  password: z.string().min(8),
});
