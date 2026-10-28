import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Parse port from CLI flags (--port 3000) or environment
const portArgIndex = process.argv.indexOf('--port');
const portFromArg = portArgIndex !== -1 ? Number(process.argv[portArgIndex + 1]) : null;
const PORT = portFromArg || Number(process.env.PORT) || 3000;

// Security: Disable X-Powered-By header
app.disable('x-powered-by');

// Security & Parsing: Limit payload size to prevent memory exhaustion
app.use(express.json({ limit: '10mb' }));

// Security: Hardened HTTP headers & CORS
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  next();
});

// OPTIONS preflight handler
app.options('*', (_req: Request, res: Response) => {
  res.sendStatus(200);
});

// Simple in-memory rate limiter (60 requests per minute per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;

function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
    return;
  }

  entry.count += 1;
  next();
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'EventGenie AI API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

interface GenerateRequestBody {
  prompt?: string;
  systemPrompt?: string;
  format?: 'text' | 'json';
}

// Gemini AI Generation Proxy
app.post('/api/generate', rateLimiter, async (req: Request<{}, {}, GenerateRequestBody>, res: Response) => {
  try {
    const { prompt, systemPrompt, format } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Request body must include a "prompt" string.' });
    }

    if (prompt.length > 8000) {
      return res.status(400).json({ error: 'Prompt exceeds maximum allowed length.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not configured in server environment.');
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Supported modern Gemini models with automatic fallback
    const models = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let lastError: Error | string | null = null;

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
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.warn(`Gemini model (${model}) call failed:`, errorMessage);
        lastError = errorMessage;
      }
    }

    console.error('All Gemini model candidates failed. Last error:', lastError);
    return res.status(502).json({
      error: 'AI service currently unavailable. Please check API key or quota.',
      details: typeof lastError === 'string' ? lastError : 'Upstream error'
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown internal error';
    console.error('API Handler Error:', errorMsg);
    return res.status(500).json({ error: 'Internal Server Error', details: errorMsg });
  }
});

async function startServer(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
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

startServer().catch((err: unknown) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
