import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters long"),
  ORG_TIMEZONE: z.string().default("Asia/Colombo"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy",
  AUTH_SECRET:
    process.env.AUTH_SECRET ||
    (process.env.NODE_ENV === "test"
      ? "test-secret-at-least-32-characters-long-key-12345"
      : undefined),
  ORG_TIMEZONE: process.env.ORG_TIMEZONE || "Asia/Colombo",
  NODE_ENV: process.env.NODE_ENV || "development",
});
