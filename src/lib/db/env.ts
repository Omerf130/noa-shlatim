/**
 * Server-only MongoDB configuration. Never import from client components.
 */
export function getMongoDbUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local for local development or to your Vercel project environment variables.",
    );
  }
  return uri;
}
