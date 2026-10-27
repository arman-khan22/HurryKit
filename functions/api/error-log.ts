import { handleErrorLogRequest } from '../../lib/errorLogHandler';

interface EventContext {
  request: Request;
}

/**
 * Cloudflare Pages Function for POST /api/error-log
 * Receives anonymous error telemetry without file names or data.
 */
export async function onRequestPost(context: EventContext): Promise<Response> {
  return handleErrorLogRequest(context.request);
}
