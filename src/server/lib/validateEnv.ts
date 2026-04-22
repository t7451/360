import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),

  // Firebase (required)
  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),

  // Firebase credentials — one of these must be present in production
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS_JSON: z.string().optional(),

  // Stripe (required in production, warn in dev)
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),

  // Optional with defaults
  REDIS_URL: z.string().url().optional(),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
  MCP_SERVER_URL: z.string().url().default('http://localhost:8765'),

  // Optional — warn if missing
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-').optional(),
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  GCS_BUCKET: z.string().optional(),
  GCS_PROJECT_ID: z.string().optional(),
  GCS_CDN_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues.map(i => `  ✗ ${i.path.join('.')}: ${i.message}`);
    console.error('\n❌ Environment validation failed:\n' + issues.join('\n') + '\n');
    process.exit(1);
  }

  const env = result.data;

  // Warn about missing optional vars
  const warnings: string[] = [];
  if (!env.ANTHROPIC_API_KEY) warnings.push('ANTHROPIC_API_KEY not set — AI generation disabled');
  if (!env.REDIS_URL) warnings.push('REDIS_URL not set — job queue will use in-memory fallback');
  if (!env.SLACK_WEBHOOK_URL) warnings.push('SLACK_WEBHOOK_URL not set — error notifications disabled');
  if (!env.GCS_BUCKET) warnings.push('GCS_BUCKET not set — asset storage disabled');
  if (env.NODE_ENV === 'production' && !env.GOOGLE_APPLICATION_CREDENTIALS && !env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    warnings.push('Neither GOOGLE_APPLICATION_CREDENTIALS nor GOOGLE_APPLICATION_CREDENTIALS_JSON set — Firebase may fail');
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment warnings:\n' + warnings.map(w => `  • ${w}`).join('\n') + '\n');
  }

  return env;
}
