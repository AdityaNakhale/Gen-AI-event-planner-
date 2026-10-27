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

## 🔐 Security

| Practice | Implementation |
|---|---|
| API Key Protection | Stored in server-side environment variables, never exposed to client |
| Server-Side Proxy | All Gemini calls proxy through `/api/generate` |
| Input Validation | Prompt length capped at 8000+ chars; method guard on POST only |
| Output Escaping | All user/AI content escaped via `_escapeHtml()` before DOM injection |
| No Secrets in Repo | `.env` excluded via `.gitignore`, `.env.example` is safe template |

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
