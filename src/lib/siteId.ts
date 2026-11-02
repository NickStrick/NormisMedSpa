export function getSiteId(): string {
  // Set in .env.local → NEXT_PUBLIC_SITE_ID=stricker-san
  if (typeof process !== 'undefined') {
    // Next.js exposes NEXT_PUBLIC_* on the client
    const id = process.env.NEXT_PUBLIC_SITE_ID;
    if (id && id.trim().length) return id;
  }
  return 'default';
}
