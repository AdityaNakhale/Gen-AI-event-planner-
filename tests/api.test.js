/**
 * EventGenie — API Handler Unit Tests
 * Tests /api/generate serverless function handler.
 */

import handler from '../api/generate.js';

function createMockReqRes({ method = 'POST', body = {}, headers = {} } = {}) {
  const req = {
    method,
    body,
    headers
  };

  const res = {
    statusCode: null,
    headers: {},
    bodyData: null,
    ended: false,
    setHeader(key, val) {
      this.headers[key] = val;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.bodyData = data;
      this.ended = true;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    }
  };

  return { req, res };
}

describe('API Route /api/generate', () => {
  const originalEnv = process.env.GEMINI_API_KEY;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-fake-gemini-key';
  });

  afterAll(() => {
    process.env.GEMINI_API_KEY = originalEnv;
    global.fetch = originalFetch;
  });

  test('handles CORS preflight OPTIONS request with 200', async () => {
    const { req, res } = createMockReqRes({ method: 'OPTIONS' });
    await handler(req, res);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(res.statusCode).toBe(200);
    expect(res.ended).toBe(true);
  });

  test('rejects non-POST HTTP methods with 405', async () => {
    const { req, res } = createMockReqRes({ method: 'GET' });
    await handler(req, res);
    expect(res.statusCode).toBe(405);
    expect(res.bodyData.error).toContain('Method not allowed');
  });

  test('returns 500 if GEMINI_API_KEY is not configured', async () => {
    delete process.env.GEMINI_API_KEY;
    const { req, res } = createMockReqRes({ method: 'POST', body: { prompt: 'Hi' } });
    await handler(req, res);
    expect(res.statusCode).toBe(500);
    expect(res.bodyData.error).toContain('Server configuration error');
  });

  test('returns 400 if prompt is missing or invalid', async () => {
    const { req, res } = createMockReqRes({ method: 'POST', body: {} });
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.bodyData.error).toContain('prompt');
  });

  test('returns 400 if prompt exceeds 8000 characters', async () => {
    const longPrompt = 'a'.repeat(8005);
    const { req, res } = createMockReqRes({ method: 'POST', body: { prompt: longPrompt } });
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.bodyData.error).toContain('maximum allowed length');
  });

  test('successfully calls Gemini and returns 200 result', async () => {
    global.fetch = async (url, options) => {
      const parsedBody = JSON.parse(options.body);
      expect(parsedBody.contents[0].parts[0].text).toBe('Create a wedding plan');
      expect(parsedBody.systemInstruction.parts[0].text).toBe('Expert Planner');
      expect(parsedBody.generationConfig.responseMimeType).toBe('application/json');

      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: '{"venue": 50000}' }]
              }
            }
          ]
        })
      };
    };

    const { req, res } = createMockReqRes({
      method: 'POST',
      body: {
        prompt: 'Create a wedding plan',
        systemPrompt: 'Expert Planner',
        format: 'json'
      }
    });

    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.bodyData.result).toBe('{"venue": 50000}');
    expect(res.bodyData.modelUsed).toBeTruthy();
  });

  test('automatically falls back to secondary model if primary fails', async () => {
    let callCount = 0;
    global.fetch = async (url) => {
      callCount++;
      if (callCount === 1) {
        // First model fails
        return {
          ok: false,
          status: 404,
          text: async () => 'Model deprecated'
        };
      }
      // Second model succeeds
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            { content: { parts: [{ text: 'Fallback response success' }] } }
          ]
        })
      };
    };

    const { req, res } = createMockReqRes({
      method: 'POST',
      body: { prompt: 'Help me plan' }
    });

    await handler(req, res);
    expect(callCount).toBe(2);
    expect(res.statusCode).toBe(200);
    expect(res.bodyData.result).toBe('Fallback response success');
  });

  test('returns 502 if all model candidates fail', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 503,
      text: async () => 'Service Overloaded'
    });

    const { req, res } = createMockReqRes({
      method: 'POST',
      body: { prompt: 'Help me plan' }
    });

    await handler(req, res);
    expect(res.statusCode).toBe(502);
    expect(res.bodyData.error).toContain('AI service currently unavailable');
  });

  test('handles network exceptions during fetch and returns 502', async () => {
    global.fetch = async () => {
      throw new Error('Network socket disconnected');
    };

    const { req, res } = createMockReqRes({
      method: 'POST',
      body: { prompt: 'Help' }
    });

    await handler(req, res);
    expect(res.statusCode).toBe(502);
    expect(res.bodyData.error).toContain('AI service currently unavailable');
  });
});
