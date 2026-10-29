import { describe, it, expect } from 'vitest';
import { handleErrorLogRequest } from '@/lib/errorLogHandler';

describe('Error Logging API Endpoint (lib/errorLogHandler.ts)', () => {
  it('accepts valid minimal telemetry payload containing only allowed fields', async () => {
    const payload = {
      errorClass: 'ENCODE_FAILED',
      toolId: 'heic-to-jpg',
      browser: 'chrome',
      version: '130',
      deviceClass: 'mid',
    };

    const req = new Request('http://localhost/api/error-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await handleErrorLogRequest(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('logged');
  });

  it('strictly rejects any payload containing file names or file data', async () => {
    const leakedPayload = {
      errorClass: 'CORRUPT_FILE',
      toolId: 'mp4-to-mp3',
      browser: 'firefox',
      version: '131',
      fileName: 'secret_recording.mp4', // Disallowed field!
    };

    const req = new Request('http://localhost/api/error-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leakedPayload),
    });

    const res = await handleErrorLogRequest(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain('strictly disallowed');
  });

  it('strictly rejects any payload containing file contents or text', async () => {
    const leakedContentPayload = {
      errorClass: 'OUT_OF_MEMORY',
      toolId: 'webp-to-png',
      browser: 'safari',
      version: '17',
      content: 'raw-image-bytes-base64...', // Disallowed field!
    };

    const req = new Request('http://localhost/api/error-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leakedContentPayload),
    });

    const res = await handleErrorLogRequest(req);
    expect(res.status).toBe(400);
  });

  it('rejects oversized payloads (> 1 KB)', async () => {
    const giantPayload = {
      errorClass: 'TOO_LARGE',
      toolId: 'mov-to-mp4',
      browser: 'chrome',
      version: '130',
      extraPadding: 'x'.repeat(2000),
    };

    const req = new Request('http://localhost/api/error-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'content-length': '2500',
      },
      body: JSON.stringify(giantPayload),
    });

    const res = await handleErrorLogRequest(req);
    expect(res.status).toBe(413);
  });
});
