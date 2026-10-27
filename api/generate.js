/**
 * EventGenie — Vercel Serverless Function (API Proxy)
 * Proxies requests to Google Gemini API.
 * The GEMINI_API_KEY is stored in Vercel environment variables — never exposed to the client.
 *
 * POST /api/generate
 * Body: { prompt: string, systemPrompt: string, format: 'text'|'json' }
 * Returns: { result: string }
 */

const PRIMARY_MODEL  = 'gemini-2.5-flash';
const FALLBACK_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest'];

function getGeminiUrl(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

export default async function handler(req, res) {
  // ── Security & CORS Headers ────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // ── Handle Preflight ────────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── Method Guard ────────────────────────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // ── API Key Guard ───────────────────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY environment variable is not set.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  // ── Input Validation ────────────────────────────────────────────────────────
  const { prompt, systemPrompt, format } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Request body must include a "prompt" string.' });
  }
  if (prompt.length > 8000) {
    return res.status(400).json({ error: 'Prompt exceeds maximum allowed length.' });
  }

  // ── Build Gemini Request ─────────────────────────────────────────────────────
  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature:     0.7,
      maxOutputTokens: 2048,
      topP:            0.9
    }
  };

  // Add system instruction if provided
  if (systemPrompt && typeof systemPrompt === 'string') {
    requestBody.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  // Ask for JSON mime type if format === 'json'
  if (format === 'json') {
    requestBody.generationConfig.responseMimeType = 'application/json';
  }

  // ── Call Gemini (with automatic model fallback) ───────────────────────────
  const candidateModels = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const url = `${getGeminiUrl(model)}?key=${apiKey}`;
      const geminiRes = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(requestBody)
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.warn(`Gemini (${model}) returned ${geminiRes.status}:`, errText);
        lastError = `Gemini (${model}): ${geminiRes.status} ${errText}`;
        continue; // Try next model
      }

      const data = await geminiRes.json();
      const result = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (result !== undefined && result !== null) {
        return res.status(200).json({ result, modelUsed: model });
      }
    } catch (err) {
      console.warn(`Error contacting Gemini (${model}):`, err.message);
      lastError = err.message;
    }
  }

  console.error('All Gemini model candidates failed. Last error:', lastError);
  return res.status(502).json({
    error: 'AI service currently unavailable. Please check API key or quota.',
    details: lastError
  });
}
