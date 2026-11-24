import serverless from 'serverless-http';
import { createApiApp } from '../../server.ts';

let cachedHandler: ReturnType<typeof serverless> | null = null;

export const handler = async (
  event: Record<string, unknown>,
  context: Record<string, unknown>,
) => {
  if (!cachedHandler) {
    const app = await createApiApp();
    cachedHandler = serverless(app);
  }
  return cachedHandler(event, context);
};
