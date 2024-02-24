import { PRODUCTION } from '../constants';

// TODO: use zod env

export const configuration = () => ({
  NODE_ENV: process.env.NODE_ENV,
  port: parseInt(process.env.PORT!) || 3001,
  jwtSecret: process.env.JWT_SECRET,
  offlineMode: process.env.OFFLINE_MODE === 'true',
  domain: process.env.COOKIE_DOMAIN,
  useS3: process.env.USE_S3 === 'true',
  jwtOption: {
    secret: process.env.JWT_SECRET,
    signOptions: {
      expiresIn: '12h',
    },
  },
  db: {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT!),
    database: process.env.DB_DATABASE,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    logging: process.env.NODE_ENV === PRODUCTION ? false : true,
  },
  s3: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
  },
});

export type Configuration = ReturnType<typeof configuration>;
