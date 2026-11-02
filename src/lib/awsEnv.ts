// src/lib/awsEnv.ts
// AWS Amplify rejects env vars starting with "AWS", so deployed builds use the
// APP_AWS_* names. The standard AWS_* names still work as a fallback (local dev).

export function awsRegion(fallback: string): string {
  return process.env.APP_AWS_REGION || process.env.AWS_REGION || fallback;
}

/** Explicit credentials when set in env; undefined lets the SDK use its default chain (IAM role, etc.). */
export function awsCredentials(): { accessKeyId: string; secretAccessKey: string } | undefined {
  const accessKeyId = process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  return accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined;
}
