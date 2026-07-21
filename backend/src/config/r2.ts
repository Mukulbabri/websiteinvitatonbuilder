import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

// Support both CLOUDFLARE_R2_* and R2_* environment variables
const accessKeyId =
  process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || '';
const secretAccessKey =
  process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || '';

// Endpoint handling: use full endpoint URL or compute from Account ID
let endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || process.env.R2_ENDPOINT || '';
if (!endpoint && process.env.R2_ACCOUNT_ID) {
  endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
}

export const R2_BUCKET_NAME =
  process.env.CLOUDFLARE_R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'datawedding';

export const R2_PUBLIC_DOMAIN = (
  process.env.VITE_CLOUDFLARE_R2_PUBLIC_URL ||
  process.env.CLOUDFLARE_R2_PUBLIC_URL ||
  process.env.R2_PUBLIC_DOMAIN ||
  'https://pub-a9d5e4da256442dba73f705f9b19ac74.r2.dev'
).replace(/\/$/, '');

export const r2Client = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export default r2Client;
