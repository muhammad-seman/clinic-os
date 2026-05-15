import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  AUTH_TOTP_ENCRYPTION_KEY: z.string().length(64),
  CLINIC_TZ: z.string().default("Asia/Makassar"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
