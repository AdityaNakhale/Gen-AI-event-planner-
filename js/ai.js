/**
 * EventGenie — AI Module
 * All functions that communicate with the Gemini API via the /api/generate proxy.
 * Handles prompts, JSON parsing, retries, and error normalization.
 */

// ─── Core Gemini Caller ───────────────────────────────────────────────────────

/**
 * Sends a prompt to the Gemini API via the server-side proxy.
 * @param {string} prompt        - User/task prompt
 * @param {string} systemPrompt  - System instruction for Gemini
 * @param {'text'|'json'} format - Expected response format
 * @param {number} [retries=2]   - Number of retry attempts on failure
 * @returns {Promise<string|Object>} Raw text or parsed JSON object
 * @throws {Error} If all retry attempts fail
 */
export async function callGemini(prompt, systemPrompt, format = 'text', retries = 2) {
  const endpoint = '/api/generate';

  // 1. Check for client-side API key override (useful for static hosting / GitHub Pages)
  const clientKey = typeof localStorage !== 'undefined'
    ? (localStorage.getItem('gemini_api_key') || localStorage.getItem('eventgenie_gemini_key'))
    : null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // If client key is explicitly configured and server endpoint failed previously, call Gemini directly
      if (clientKey && attempt > 0) {
        return await _callGeminiDirect(prompt, systemPrompt, format, clientKey);
      }

      const response = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prompt, systemPrompt, format })
      });

      if (response.status === 404) {
        // Dev server is static-only (e.g. 'serve' or Live Server)
        if (clientKey) {
          return await _callGeminiDirect(prompt, systemPrompt, format, clientKey);
        }
        throw new Error('Endpoint /api/generate returned 404. Start the app with "npm run dev" to enable local AI proxy, or configure a Gemini API key.');
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API error ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      const text = data.result || '';

      if (format === 'json') {
        return _safeParseJSON(text);
      }
      return text;

    } catch (err) {
      // Do not retry on 404 if no client key is available
      if (err.message.includes('404')) throw err;
      if (attempt === retries) {
        if (clientKey) {
          try {
            return await _callGeminiDirect(prompt, systemPrompt, format, clientKey);
          } catch (directErr) {
            throw err;
          }
        }
        throw err;
      }
      // Exponential backoff: 500ms, 1000ms
      await _sleep(500 * Math.pow(2, attempt));
    }
  }
}

/**
 * Direct browser-to-Gemini fallback (for static hosts or offline test keys).
 */
async function _callGeminiDirect(prompt, systemPrompt, format, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const requestBody = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
  };
  if (systemPrompt) {
    requestBody.systemInstruction = { parts: [{ text: systemPrompt }] };
  }
  if (format === 'json') {
    requestBody.generationConfig.responseMimeType = 'application/json';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Direct Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return format === 'json' ? _safeParseJSON(text) : text;
}

// ─── Budget Breakdown ─────────────────────────────────────────────────────────

/**
 * Asks Gemini to generate an intelligent budget breakdown.
 * @param {string} eventType
 * @param {number} totalBudget
 * @param {number} guestCount
 * @param {string} preferences
 * @param {string} [currency='INR']
 * @returns {Promise<Object>} { category: amount, ... }
 */
export async function generateBudgetBreakdown(eventType, totalBudget, guestCount, preferences, currency = 'INR') {
  const systemPrompt = `You are an expert event planning financial advisor. 
You always respond with valid JSON only, no markdown, no explanation.
Return a JSON object where keys are vendor/category names and values are numbers (amounts in ${currency}).
The amounts must sum exactly to ${totalBudget}.`;

  const prompt = `Create a detailed budget breakdown for a ${eventType} with these details:
- Total budget: ${totalBudget} ${currency}
- Guest count: ${guestCount}
- Preferences: ${preferences || 'standard'}

Return a JSON object with category names as keys and allocated amounts as numbers.
Ensure the total equals exactly ${totalBudget}.
Example format: {"Venue": 7500, "Catering": 7500, "Photography": 3000, ...}`;

  return callGemini(prompt, systemPrompt, 'json');
}

// ─── Vendor Checklist ─────────────────────────────────────────────────────────

/**
 * Asks Gemini to generate a vendor checklist with cost estimates.
 * @param {string} eventType
 * @param {number} totalBudget
 * @param {number} guestCount
 * @param {string} venue
 * @param {string} preferences
 * @param {string} [currency='INR']
 * @returns {Promise<Object[]>} Array of vendor objects
 */
export async function generateVendorChecklist(eventType, totalBudget, guestCount, venue, preferences, currency = 'INR') {
  const systemPrompt = `You are an expert event planner. 
You always respond with valid JSON only — a JSON array, no markdown, no explanation.`;

  const prompt = `Generate a vendor checklist for a ${eventType}:
- Budget: ${totalBudget} ${currency}
- Guests: ${guestCount}
- Venue: ${venue || 'TBD'}
- Preferences: ${preferences || 'standard'}

Return a JSON array where each item has exactly these fields:
- name (string): Vendor category name
- category (string): Type of vendor
- estimated (number): Estimated cost in ${currency}
- notes (string): Short helpful tip
- priority (string): "high", "medium", or "low"

Example: [{"name": "Venue", "category": "Space", "estimated": 75000, "notes": "Book 6 months early", "priority": "high"}]`;

  return callGemini(prompt, systemPrompt, 'json');
}

// ─── Timeline Items ───────────────────────────────────────────────────────────

/**
 * Asks Gemini to generate additional personalized timeline tasks.
 * @param {string} eventType
 * @param {string} eventDate
 * @param {string} preferences
 * @returns {Promise<Object[]>} Array of additional task suggestions
 */
export async function generateTimelineItems(eventType, eventDate, preferences) {
  const systemPrompt = `You are an expert event planner. 
Respond with valid JSON only — a JSON array of task objects. No markdown or explanation.`;

  const prompt = `Generate 5 personalized planning tasks for a ${eventType} on ${eventDate}.
Preferences: ${preferences || 'standard'}

Return a JSON array with each item having:
- task (string): Clear, actionable task description
- monthsBefore (number): Months before the event this should be done
- category (string): Task category
- notes (string): Why this task matters

Example: [{"task": "Book a drone photographer for aerial shots", "monthsBefore": 8, "category": "Media", "notes": "Drone permits take time to arrange"}]`;

  return callGemini(prompt, systemPrompt, 'json');
}

// ─── Event Ideas ──────────────────────────────────────────────────────────────

/**
 * Asks Gemini to generate personalized event ideas.
 * @param {string} eventType
 * @param {string} preferences
 * @param {number} totalBudget
 * @param {number} guestCount
 * @param {string} [currency='INR']
 * @returns {Promise<Object>} { themes, decor, catering, entertainment }
 */
export async function generateEventIdeas(eventType, preferences, totalBudget, guestCount, currency = 'INR') {
  const systemPrompt = `You are a creative event designer with expertise in ${eventType}s.
Respond with valid JSON only. No markdown, no extra text.`;

  const prompt = `Generate creative, personalized ideas for a ${eventType}:
- Budget: ${totalBudget} ${currency} for ${guestCount} guests
- Style preferences: ${preferences || 'no specific preference'}

Return a JSON object with these 4 arrays:
- themes: 3 unique theme ideas (strings)
- decor: 4 specific decoration ideas (strings)  
- catering: 4 food & drink ideas (strings)
- entertainment: 3 entertainment ideas (strings)

Make suggestions realistic for the budget. Be creative but practical.`;

  return callGemini(prompt, systemPrompt, 'json');
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────

/**
 * Sends a user message to Gemini with full event context.
 * @param {string} userMessage   - The user's question
 * @param {Object} eventContext  - The current plan object
 * @returns {Promise<string>} AI response text
 */
export async function generateAIResponse(userMessage, eventContext) {
  const systemPrompt = `You are EventGenie, a friendly and expert AI event planning assistant.
You have context about the user's specific event and give practical, personalized advice.
Keep responses concise (2-4 sentences max), warm, and actionable.
Use emojis sparingly to be friendly.`;

  const contextSummary = eventContext ? `
Current event context:
- Event: ${eventContext.eventType} — "${eventContext.eventName}"
- Date: ${eventContext.eventDate}
- Guests: ${eventContext.guestCount}
- Budget: ${eventContext.totalBudget} ${eventContext.currency || 'INR'}
- Venue: ${eventContext.venue || 'Not yet decided'}
- Preferences: ${eventContext.preferences || 'None specified'}
` : 'No event context available yet.';

  const prompt = `${contextSummary}\n\nUser question: ${userMessage}`;

  return callGemini(prompt, systemPrompt, 'text');
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

/**
 * Safely parses a JSON string, stripping markdown code fences if present.
 * @param {string} text
 * @returns {Object|Array} Parsed JSON
 * @throws {Error} If parsing fails after cleanup
 */
function _safeParseJSON(text) {
  // Strip markdown code fences (```json ... ```)
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  // Find the first { or [ and the last } or ]
  const firstBrace = cleaned.search(/[{[]/);
  if (firstBrace > 0) cleaned = cleaned.slice(firstBrace);
  const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  if (lastBrace !== -1 && lastBrace < cleaned.length - 1) {
    cleaned = cleaned.slice(0, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Failed to parse AI response as JSON: ${e.message}\nRaw: ${text.slice(0, 200)}`);
  }
}

/**
 * Sleeps for a given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function _sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
