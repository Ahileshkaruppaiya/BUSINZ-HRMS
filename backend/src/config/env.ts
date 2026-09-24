import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.union([z.coerce.number(), z.string()]).default(8000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().url().default('https://psccqynqwebbtzdaqfqv.supabase.co'),
  SUPABASE_ANON_KEY: z.string().default('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY2NxeW5xd2ViYnR6ZGFxZnF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMjA1NjAsImV4cCI6MjEwNDY5NjU2MH0.W8dsNMM6qIVQI0OBC4ZhpOC8T1n0KxfDAhtgskW43CI'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY2NxeW5xd2ViYnR6ZGFxZnF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTEyMDU2MCwiZXhwIjoyMTA0Njk2NTYwfQ.fEKlhQcQLXl_A87hVTaVYamtthXfN7UiEV7aHk_WPa0'),
  JWT_SECRET: z.string().default('vrm-hrms-dev-jwt-secret-key-replace-in-production-2026'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000,*'),
  DATABASE_URL: z.string().default('postgresql://postgres:Ahilesh%402004%40@db.psccqynqwebbtzdaqfqv.supabase.co:5432/postgres'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 mins default
  RATE_LIMIT_MAX: z.coerce.number().default(25000), // high capacity for 100+ req/s
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = {
  ...parsedEnv.data,
  corsOriginsList: parsedEnv.data.CORS_ORIGINS.split(',').map(s => s.trim()),
};
