import { z } from 'zod';

/**
 * Strict schema for anonymous client error reporting.
 * Strictly rejects any additional properties (such as file names, sizes, or contents).
 */
export const ErrorLogSchema = z
  .object({
    errorClass: z.string().min(1).max(64),
    toolId: z.string().min(1).max(64),
    browser: z.string().min(1).max(32),
    version: z.string().min(1).max(32),
    deviceClass: z.enum(['low', 'mid', 'high']).optional(),
  })
  .strict();

export async function handleErrorLogRequest(request: Request): Promise<Response> {
  const contentLength = Number(request.headers.get('content-length') || '0');
  if (contentLength > 1024) {
    return new Response(
      JSON.stringify({ error: 'Payload too large. Maximum 1 KB allowed.' }),
      { status: 413, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let rawJson: unknown;
  try {
    const rawText = await request.text();
    if (rawText.length > 1024) {
      return new Response(
        JSON.stringify({ error: 'Payload too large. Maximum 1 KB allowed.' }),
        { status: 413, headers: { 'Content-Type': 'application/json' } },
      );
    }
    rawJson = JSON.parse(rawText);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Malformed JSON payload.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const result = ErrorLogSchema.safeParse(rawJson);
  if (!result.success) {
    return new Response(
      JSON.stringify({
        error:
          'Invalid telemetry payload. Error logging strictly accepts only errorClass, toolId, browser, and version. File names, file contents, and personal data are strictly disallowed.',
        issues: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { errorClass, toolId } = result.data;
  return new Response(
    JSON.stringify({ status: 'logged', id: `${toolId}:${errorClass}` }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}
