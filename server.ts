import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Parse port from CLI flags (--port 3000) or env
const portArgIndex = process.argv.indexOf('--port');
const portFromArg = portArgIndex !== -1 ? Number(process.argv[portArgIndex + 1]) : null;
const PORT = portFromArg || Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Allow iframe embedding from AI Studio and CORS
app.use((_req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Gemini API Proxy
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, systemPrompt, format } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Request body must include a "prompt" string.' });
    }

    if (prompt.length > 10000) {
      return res.status(400).json({ error: 'Prompt exceeds maximum allowed length.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment.');
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Try candidate models in order of preference
    const models = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let lastError: any = null;

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: systemPrompt || undefined,
            responseMimeType: format === 'json' ? 'application/json' : undefined,
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        });

        const text = response.text;
        if (text !== undefined && text !== null) {
          return res.status(200).json({ result: text, modelUsed: model });
        }
      } catch (err: any) {
        console.warn(`Gemini model (${model}) call failed:`, err?.message || err);
        lastError = err;
      }
    }

    console.error('All Gemini model candidates failed. Last error:', lastError);
    return res.status(502).json({
      error: 'AI service currently unavailable. Please check API key or quota.',
      details: lastError?.message || String(lastError),
    });
  } catch (error: any) {
    console.error('API Handler Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error?.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ EventGenie Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
