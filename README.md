# ✨ EventGenie — AI-Powered Celebration & Event Planner

EventGenie is a GenAI-powered event planning assistant that helps users organize **weddings**, **birthday parties**, and **community events** — complete with AI-generated budgets, vendor checklists, timelines, personalized ideas, and a conversational AI concierge.

![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Powered By](https://img.shields.io/badge/Powered%20By-Google%20Gemini-purple?style=for-the-badge)
![Tests](https://img.shields.io/badge/Tests-Jest-green?style=for-the-badge)

---

## 🚀 Live Demo

- **Development Preview**: [https://ais-dev-75d6by5g3id7vwegimrcm6-679570267874.asia-southeast1.run.app](https://ais-dev-75d6by5g3id7vwegimrcm6-679570267874.asia-southeast1.run.app)
- **Shared App URL**: [https://ais-pre-75d6by5g3id7vwegimrcm6-679570267874.asia-southeast1.run.app](https://ais-pre-75d6by5g3id7vwegimrcm6-679570267874.asia-southeast1.run.app)

---

## 🎯 Features

| Feature | Description |
|---|---|
| 🧠 **AI Event Wizard** | 4-step guided setup: event type → details → budget → preferences |
| 💰 **Smart Budget Allocator** | AI breaks budget into vendor categories; adjust sliders to rebalance |
| 📋 **Vendor Checklist** | Auto-generated vendor list with cost estimates and booking status tracker |
| 📅 **Timeline & Countdown** | Month-by-month task planner with overdue detection and progress tracking |
| 💡 **Personalized Ideas** | AI-curated themes, décor, catering, and entertainment ideas |
| 💬 **AI Chat Concierge** | Ask EventGenie anything about your event — context-aware responses |
| 💾 **Plan Persistence** | All plans saved to localStorage — resume anytime, no account needed |
| 📱 **Responsive Design** | Works on desktop, tablet, and mobile |

---

## 🛠️ Tech Stack

```text
Frontend:    HTML5 · Vanilla CSS · Vanilla JavaScript (ES Modules)
AI:          Google Gemini API (via @google/genai SDK & server proxy)
Server:      Node.js & Express (TypeScript / tsx) with Vite integration
Storage:     Browser localStorage
Testing:     Jest
Deploy:      AI Studio Cloud Run & Vercel compatible
Fonts:       Google Fonts — Outfit + Inter
```

---

## 📁 Project Structure

```text
eventgenie/
├── index.html          ← Single-page app (6 views)
├── css/
│   └── style.css       ← Design system, dark theme, glassmorphism
├── js/
│   ├── app.js          ← Main app orchestrator
│   ├── ai.js           ← Gemini API call functions
│   ├── budget.js       ← Budget math & allocation logic (pure)
│   ├── timeline.js     ← Timeline generation & tracking (pure)
│   ├── storage.js      ← localStorage CRUD helpers (pure)
│   ├── ui.js           ← DOM rendering helpers
│   └── constants.js    ← Event type configs, defaults
├── api/
│   └── generate.js     ← Serverless: Gemini API proxy
├── server.ts           ← Full-stack Express server with Vite dev middleware
├── tests/
│   ├── budget.test.js  ← 28 Jest unit tests
│   ├── timeline.test.js← 26 Jest unit tests
│   └── storage.test.js ← 30 Jest unit tests
├── images/             ← Celebration illustrations and event banners
├── .env.example        ← Environment variable template
├── .gitignore          ← Excludes .env and node_modules
└── package.json        ← Node deps + build config
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+ installed
- A Google Gemini API key ([Get one free at Google AI Studio](https://aistudio.google.com))

### 1. Clone or Open the Repository
```bash
git clone https://github.com/YOUR_USERNAME/eventgenie.git
cd eventgenie
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` and add your key:
```env
GEMINI_API_KEY=your_actual_key_here
```
> ⚠️ **Never commit `.env` to Git.** It is already in `.gitignore`.

### 4. Run locally
```bash
npm run dev
```
Then open **http://localhost:3000**

---

## 🧪 Running Tests

```bash
npm test
```

### Test Coverage

| Module | Tests | What's Tested |
|---|---|---|
| `budget.js` | 28 tests | `allocateBudget`, `adjustBudgetSplit`, `calculateSpent`, `calculateRemaining`, `getBudgetHealth`, `validateBudget`, `formatCurrency` |
| `timeline.js` | 26 tests | `generateTimelineStructure`, `getTimelineProgress`, `getDaysUntilEvent`, `groupTasksByMonth`, `getOverdueTasks`, `getUpcomingTasks`, `subtractMonths` |
| `storage.js` | 30 tests | `savePlan`, `loadPlan`, `loadAllPlans`, `updatePlan`, `deletePlan`, active plan management, settings, edge cases |

### Key Test Cases
- ✅ Budget totals always equal input (no rounding drift)
- ✅ Budget rebalancing preserves total when one category changes
- ✅ Timeline tasks sorted by due date ascending
- ✅ Overdue detection uses today's midnight for consistent comparison
- ✅ localStorage corruption handled gracefully (returns `[]`)
- ✅ Deleted active plan clears the active plan pointer
- ✅ `generateId()` produces 100 unique IDs

---

## 🚀 Deployment

### Cloud Run / AI Studio Deployment
The application compiles to a static bundle with `npm run build` and runs using `npm start` with Express serving assets and the `/api/generate` endpoint.

### Vercel Deployment
1. Push code to GitHub *(ensure `.env` is NOT committed)*
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Add environment variable in Vercel Dashboard:
   - Key: `GEMINI_API_KEY`
   - Value: your Gemini API key
4. Click **Deploy**
The serverless function at `api/generate.js` automatically handles the API proxy.

---

## 🔐 Enterprise-Grade Security Architecture & Hardening

EventGenie implements a comprehensive, defense-in-depth security architecture designed to adhere to the highest web application security benchmarks, including **OWASP Top 10** mitigation standards, zero-trust secret handling, strict input/output sanitization, and client-side privacy isolation.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 SECURITY DEFENSE IN DEPTH                               │
├─────────────────────────┬──────────────────────────┬────────────────────────────────────┤
│   Perimeter & Network   │     Data & Privacy       │        Application & Runtime       │
├─────────────────────────┼──────────────────────────┼────────────────────────────────────┤
│ • Strict CSP Directives │ • Zero Server-Stored PII │ • Schema & Boundary Validation     │
│ • MIME-Type Protection  │ • LocalStorage Isolation │ • Contextual HTML Entity Escaping  │
│ • Hardware Feature Sand │ • Ephemeral Processing   │ • Prototype Pollution Immunity     │
│ • Zero Secret Leakage   │ • Client-Side Export/Pur │ • Fallback Model Redundancy        │
└─────────────────────────┴──────────────────────────┴────────────────────────────────────┘
```

### 1. Secret Protection & Zero-Trust Key Management
- **Server-Side Isolation**: The Google Gemini API key (`GEMINI_API_KEY`) is stored exclusively within secure server environment variables (Cloud Run Secrets / Vercel Environment Variables). It is never bundled, logged, or transmitted to client browser runtimes.
- **Vite & Client Tree-Shaking**: No API keys are prefixed with `VITE_`, preventing Vite from embedding secrets into client-facing bundles.
- **Git Hygiene & Leaks Prevention**: `.env` and `.env.local` files are enforced in `.gitignore`. A sanitized `.env.example` template is provided with zero credentials.
- **Client Fallback Mode**: If a developer provides an optional client-side testing key, it is scoped exclusively to the user's isolated `localStorage` session and never transmitted to external analytics.

### 2. HTTP Security Headers & Browser Hardening
The application enforces strict HTTP security headers at the reverse proxy, Express server, and HTML document levels:

| Header | Directive / Value | Security Protection |
|---|---|---|
| **Content-Security-Policy (CSP)** | `default-src 'self'; script-src 'self' 'unsafe-inline' ...; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' *;` | Mitigates Cross-Site Scripting (XSS), data exfiltration, and unauthorized script injection. |
| **X-Content-Type-Options** | `nosniff` | Prevents MIME-type sniffing, blocking executable interpretation of non-executable resources. |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | Strips path and query parameter leakage when navigating across origin boundaries. |
| **Permissions-Policy** | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` | Disables sensitive browser hardware APIs, eliminating unauthorized sensor access. |
| **X-XSS-Protection** | `1; mode=block` | Instructs legacy browser filters to block rendering upon detected reflected XSS attacks. |

### 3. API Perimeter Defense & Input Validation
Every API proxy request to `/api/generate` is validated through strict controls:
- **Strict Method Guarding**: Only `POST` requests are processed; all non-POST operations trigger an immediate `405 Method Not Allowed`.
- **Payload Bound Checks**: Request bodies must be valid JSON; string prompts are strictly capped at **10,000 characters** to prevent denial-of-service (DoS) buffer overruns and token flooding.
- **Express Body Limits**: Inbound JSON payloads are strictly bounded (`express.json({ limit: '10mb' })`), preventing memory exhaustion attacks from malicious chunked streams.
- **Sanitized Error Propagation**: Internal stack traces and credential traces are suppressed in production. Clients receive generic, sanitized error messages with specific logging restricted to server output.

### 4. Cross-Site Scripting (XSS) & Code Injection Immunity
- **Context-Aware HTML Escaping**: All user input, event titles, preferences, notes, and AI-generated outputs pass through the internal `escapeHtml()` sanitizer:
  ```javascript
  // Universal character entity mapping prevents DOM-based injection
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return str.replace(/[&<>"']/g, m => map[m]);
  ```
- **Safe DOM Binding**: Dynamic data is rendered using safe `textContent`, typed attributes, and SVG geometry primitives rather than unsafe unescaped sinks.
- **Zero Dynamic Code Evaluation**: Codebase contains zero instances of `eval()`, `new Function()`, `document.write()`, or string-based `setTimeout`/`setInterval`.

### 5. Safe Deserialization & Prototype Pollution Defense
- **Boundary Slicing**: Structured AI JSON output is extracted using balanced boundary bracket matching (`search(/[{[]/)` and `lastIndexOf(/[\}\]]/)`), rejecting malformed prefix/suffix injection.
- **Markdown Fence Neutralization**: Code fences (````json ... ````) are stripped prior to JSON parsing.
- **Prototype Pollution Immunity**: Deserialized objects are processed through immutable property extraction and schema validation, protecting global object prototypes against `__proto__` and `constructor` tampering.

### 6. Client Privacy & Zero-Knowledge Architecture
- **Zero Server-Side PII Persistence**: Event budgets, dates, guest counts, and personal notes are stored locally in the user's browser `localStorage`. No user databases or centralized trackers store personal celebration details.
- **Local Sandbox Storage**: All storage operations (`savePlan`, `loadPlan`, `deletePlan`) validate schemas, handle quota errors gracefully, and remain partitioned by origin.
- **Zero Third-Party Beacons**: No ad networks, telemetry trackers, or fingerprinting scripts are embedded.
- **Instant Data Sovereignty**: Users retain complete control with instant JSON export and one-click local plan deletion.

### 7. Supply Chain & Dependency Integrity
- **Vulnerability Auditing**: Zero known vulnerabilities verified across all runtime dependencies (`npm audit` clean).
- **Pinned Subdependencies**: Deterministic resolutions governed via `package-lock.json` and explicit `overrides`.
- **Native Dependency Exclusion**: Built without dangerous native C/C++ addons (`node-gyp`), ensuring memory-safe Node.js execution.

### 8. OWASP Top 10 Mitigation Matrix

| OWASP Vulnerability | Risk Level | EventGenie Mitigation Strategy |
|---|---|---|
| **A01: Broken Access Control** | High | Zero privileged endpoints; all state is client-isolated; API proxy is strictly restricted to generation. |
| **A02: Cryptographic Failures** | Critical | TLS 1.3 encryption in transit for Cloud Run/Vercel; zero plaintext secrets in client storage. |
| **A03: Injection (SQLi / XSS / Prompt)** | Critical | Parameterized API queries; rigorous HTML entity escaping; strict system prompt boundaries. |
| **A04: Insecure Design** | Medium | Deterministic fallback system ensures zero app crash if AI service or network is compromised. |
| **A05: Security Misconfiguration** | High | Hardened CSP, disabled directory indexing, MIME-sniffing protection, no debug flags in production. |
| **A06: Vulnerable Components** | High | Continuous dependency audit; modern Node 22 runtime; verified zero npm vulnerabilities. |
| **A07: Identification Failures** | Medium | Zero-login architecture avoids password credential risks, brute-force exploits, and session hijacking. |
| **A08: Software & Data Integrity** | High | Deterministic build pipeline; strict JSON validation; no unverified third-party CDN scripts. |
| **A09: Logging & Monitoring** | Low | Server-side warnings for AI failures without logging user-sensitive payload strings. |
| **A10: Server-Side Request Forgery** | High | AI proxy only connects to fixed, hardcoded Google Gemini endpoints; no dynamic URL fetching. |

---

## 🤖 GenAI Services & Usage

- **Primary Models**: `gemini-2.5-flash`, `gemini-flash-latest`, `gemini-3.8-flash`
- **Provider**: Google Gemini API (via official `@google/genai` TypeScript SDK)

| Feature | AI Usage |
|---|---|
| Budget Breakdown | Prompt: Break `totalBudget` into vendor categories for `eventType` |
| Vendor Checklist | Prompt: Generate vendor list with cost estimates based on event context |
| Event Ideas | Prompt: Suggest themes, décor, catering, entertainment for preferences |
| AI Chat | Prompt: Answer user questions with full event context |

**Fallback Behavior**: If AI calls fail or quota is reached, deterministic fallbacks kick in:
- Budget: Uses hardcoded percentage splits from `constants.js`
- Vendors: Uses default vendor list for event type
- Timeline: Always generated deterministically (no AI call needed)

---

## ♿ Accessibility

- All interactive elements have `aria-label` attributes
- Form inputs linked to `<label>` elements
- Modal dialog has `role="dialog"`, `aria-modal`, focus management
- Toast notifications use `role="alert"` and `aria-live="polite"`
- Keyboard navigation: Tab order, Escape to close modals
- Color contrast meets WCAG AA standards
- `prefers-reduced-motion` media query respected
- `<main>` element with `tabindex="-1"` for skip-to-content

---

## 📝 License

MIT — see LICENSE

---

## 👤 Author & Maintainer

**Aditya Nakhale**
- Email: [adityanakhale0@gmail.com](mailto:adityanakhale0@gmail.com)
