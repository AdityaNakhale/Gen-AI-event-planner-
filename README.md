# ✨ EventGenie — AI-Powered Celebration & Event Planner

**EventGenie** is a modern, GenAI-driven celebration planning assistant built and maintained by **Aditya Nakhale**. It empowers users to effortlessly organize weddings, birthday parties, and community gatherings with intelligent budget allocation, dynamic vendor checklists, milestone timelines, curated ideas, and an interactive AI concierge powered by Google Gemini.

---

## 🎯 Key Features

- 🧠 **AI Event Wizard**: Guided 4-step event creation covering event types, guest counts, venues, budget priorities, and aesthetic vibes.
- 💰 **Smart Budget Allocator**: Real-time budget breakdown across venue, catering, decor, photography, entertainment, and attire with interactive slider rebalancing.
- 📋 **Vendor Checklist**: Actionable vendor tracking with cost estimation, contact statuses (Not Started, Contacted, Booked, Paid), and custom vendor additions.
- 📅 **Dynamic Timeline & Countdown**: Auto-generated milestone planner counting down to event day with overdue detection and progress metrics.
- 💡 **Personalized Creative Ideas**: AI-curated themes, décor inspirations, catering concepts, and entertainment ideas tailored to event preferences.
- 💬 **Context-Aware AI Chat Concierge**: Real-time event planning assistant with context of your active event budget, guests, and theme.
- 💾 **Local Persistence & Export**: Saves events in local storage without requiring accounts, with JSON export/import and print-ready summary.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES Modules), CSS Design System (Outfit & Inter typography).
- **Backend**: Node.js & Express server (`server.ts`) with Vite dev middleware.
- **AI Integration**: Google Gemini API via official `@google/genai` TypeScript SDK with server-side proxy (`/api/generate`) and automatic fallback models (`gemini-2.5-flash`, `gemini-flash-latest`, `gemini-3.8-flash`).
- **Resilience**: Zero-crash architecture with deterministic math and category fallbacks if network or API keys are unavailable.

---

## 👤 Author & Maintainer

**Aditya Nakhale**
- Email: [adityanakhale0@gmail.com](mailto:adityanakhale0@gmail.com)
