/**
 * EventGenie — AI Module Unit Tests
 * Tests js/ai.js functions, prompts, JSON parsing, retries, and direct fallback.
 */

import {
  callGemini,
  generateBudgetBreakdown,
  generateVendorChecklist,
  generateTimelineItems,
  generateEventIdeas,
  generateAIResponse
} from '../js/ai.js';

describe('AI Module (js/ai.js)', () => {
  const originalFetch = global.fetch;
  let mockStorage = {};

  beforeEach(() => {
    mockStorage = {};
    global.localStorage = {
      getItem: (k) => mockStorage[k] || null,
      setItem: (k, v) => { mockStorage[k] = String(v); },
      removeItem: (k) => { delete mockStorage[k]; },
      clear: () => { mockStorage = {}; }
    };
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('callGemini', () => {
    test('returns raw text response when format is text', async () => {
      global.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({ result: 'Here is your party idea!' })
      });

      const res = await callGemini('Hello', 'System', 'text');
      expect(res).toBe('Here is your party idea!');
    });

    test('strips markdown code blocks and returns parsed JSON object', async () => {
      global.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          result: '```json\n{\n  "Venue": 25000,\n  "Catering": 30000\n}\n```'
        })
      });

      const res = await callGemini('Give me JSON', 'System', 'json');
      expect(res).toEqual({ Venue: 25000, Catering: 30000 });
    });

    test('extracts embedded JSON when surrounded by extraneous AI commentary', async () => {
      global.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          result: 'Sure! Here is the plan: {"Venue": 5000} Hope this helps!'
        })
      });

      const res = await callGemini('Prompt', 'System', 'json');
      expect(res).toEqual({ Venue: 5000 });
    });

    test('throws descriptive error on 404 when no client key is available', async () => {
      global.fetch = async () => ({
        ok: false,
        status: 404,
        text: async () => '404 Not Found'
      });

      await expect(callGemini('Prompt', 'System', 'text', 1))
        .rejects
        .toThrow(/404/);
    });

    test('falls back to direct browser Gemini call when endpoint returns 404 and clientKey is set', async () => {
      global.localStorage.setItem('gemini_api_key', 'user-client-secret-key');

      let calledDirectUrl = false;
      global.fetch = async (url) => {
        if (url === '/api/generate') {
          return { ok: false, status: 404, text: async () => 'Not found' };
        }
        if (url.includes('generativelanguage.googleapis.com')) {
          calledDirectUrl = true;
          return {
            ok: true,
            status: 200,
            json: async () => ({
              candidates: [{ content: { parts: [{ text: 'Direct response!' }] } }]
            })
          };
        }
      };

      const result = await callGemini('Hello direct', 'System prompt', 'text');
      expect(calledDirectUrl).toBe(true);
      expect(result).toBe('Direct response!');
    });

    test('retries on transient failure and succeeds on second attempt', async () => {
      let attempts = 0;
      global.fetch = async () => {
        attempts++;
        if (attempts === 1) {
          return { ok: false, status: 500, text: async () => 'Internal Error' };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ result: 'Recovered!' })
        };
      };

      const res = await callGemini('Test retry', 'System', 'text', 2);
      expect(attempts).toBe(2);
      expect(res).toBe('Recovered!');
    });

    test('throws error when JSON response cannot be parsed', async () => {
      global.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({ result: 'this is not valid json at all' })
      });

      await expect(callGemini('Prompt', 'System', 'json'))
        .rejects
        .toThrow(/Failed to parse AI response as JSON/);
    });

    test('handles direct call error when Google API returns non-200', async () => {
      global.localStorage.setItem('gemini_api_key', 'test-key');
      global.fetch = async (url) => {
        if (url === '/api/generate') {
          return { ok: false, status: 404, text: async () => 'Not found' };
        }
        return {
          ok: false,
          status: 403,
          text: async () => 'API key invalid'
        };
      };

      await expect(callGemini('Prompt', 'System', 'text'))
        .rejects
        .toThrow(/Direct Gemini API error 403/);
    });

    test('supports direct call with format json and parses output', async () => {
      global.localStorage.setItem('gemini_api_key', 'test-key');
      global.fetch = async (url) => {
        if (url === '/api/generate') {
          return { ok: false, status: 404, text: async () => 'Not found' };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: '{"success": true}' }] } }]
          })
        };
      };

      const result = await callGemini('Prompt', 'System', 'json');
      expect(result).toEqual({ success: true });
    });
  });

  describe('Prompt Generators', () => {
    beforeEach(() => {
      global.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          result: JSON.stringify({ Venue: 15000, Catering: 20000 })
        })
      });
    });

    test('generateBudgetBreakdown calls Gemini with expected params', async () => {
      const breakdown = await generateBudgetBreakdown('birthday', 35000, 20, 'Casual', 'INR');
      expect(breakdown).toHaveProperty('Venue');
    });

    test('generateVendorChecklist calls Gemini and returns vendor list', async () => {
      global.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          result: JSON.stringify([{ name: 'DJ', estimated: 5000 }])
        })
      });

      const vendors = await generateVendorChecklist('wedding', 100000, 100, 'Grand Hotel', 'Elegant', 'INR');
      expect(Array.isArray(vendors)).toBe(true);
      expect(vendors[0].name).toBe('DJ');
    });

    test('generateTimelineItems returns array of tasks', async () => {
      global.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          result: JSON.stringify([{ task: 'Book Cake', monthsBefore: 1 }])
        })
      });

      const tasks = await generateTimelineItems('birthday', '2026-10-28', 'Vegan');
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks[0].task).toBe('Book Cake');
    });

    test('generateEventIdeas returns themes, decor, catering, entertainment', async () => {
      global.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          result: JSON.stringify({
            themes: ['Boho Chic'],
            decor: ['Fairy lights'],
            catering: ['Grazing table'],
            entertainment: ['Acoustic Duo']
          })
        })
      });

      const ideas = await generateEventIdeas('wedding', 'Rustic', 80000, 50, 'INR');
      expect(ideas).toHaveProperty('themes');
      expect(ideas).toHaveProperty('decor');
      expect(ideas).toHaveProperty('catering');
      expect(ideas).toHaveProperty('entertainment');
    });

    test('generateAIResponse generates friendly advice with and without context', async () => {
      global.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({ result: 'We recommend outdoor lanterns!' })
      });

      const responseWithContext = await generateAIResponse('What decor?', {
        eventName: 'Ankit Birthday',
        eventType: 'birthday',
        eventDate: '2026-10-28',
        guestCount: 10,
        totalBudget: 7500,
        venue: 'Barista Cafe'
      });
      expect(responseWithContext).toBe('We recommend outdoor lanterns!');

      const responseWithoutContext = await generateAIResponse('Hello', null);
      expect(responseWithoutContext).toBe('We recommend outdoor lanterns!');
    });
  });
});
