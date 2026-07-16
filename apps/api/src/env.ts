import { parseEnv, port, z } from 'znv'

export const environment = parseEnv(process.env, {
  PORT: port(),
  JWT_SECRET: z.string(),

  COOKIE_DOMAIN: z.string(),
  OFFLINE_MODE: z.boolean(),

  USE_S3: z.boolean().default(false),
  S3_ACCESS_KEY_ID: z.string().default(''),
  S3_SECRET_ACCESS_KEY: z.string().default(''),
  S3_ENDPOINT: z.string().default(''),
  S3_REGION: z.string().default(''),
  S3_BUCKET: z.string().default(''),

  DATABASE_URL: z.string(),
  NODE_ENV: z.enum(['development', 'production']).default('production'),
})
