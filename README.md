# MindCheck

A calm, full-stack daily stress tracker and relief companion built with TypeScript, React, Express, and SQLite.

## Overview

MindCheck helps you understand and manage stress through daily check-ins, personalized relief suggestions, and insightful dashboards. The app recognizes that stress is human and normal—offering small, doable actions to help you feel lighter.

### Key Features

- **Daily Check-ins**: Log mood, sleep quality, meals, activity, social connection, and workload in 2 minutes
- **Stress Scoring**: Algorithmic calculation (0-100) based on sleep, workload, mood, activity, nutrition, and social factors
- **Personalized Relief**: 13+ categories of suggestions (breathing, journaling, music, boundaries, support) tailored to your stress patterns
- **Dashboard Insights**: 
  - Weekly trends and stress heatmaps
  - Upcoming event tracking with pre-exam stress patterns
  - Sleep debt monitoring
  - Burnout warnings and protective shields
  - Badges and streaks for encouragement
- **Pulse Checks**: Quick 1-minute mood and focus snapshots between check-ins
- **Reflective Journal**: Guided prompts based on daily stress and patterns
- **Breathing Guides**: Animated box breathing and guided calm practices

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** + **Custom CSS** for glassmorphism design system
- **Framer Motion** for smooth animations
- **React Router** for navigation
- **Recharts** for data visualization

### Backend
- **Express.js** with TypeScript
- **SQLite** with WAL mode for data persistence
- **JWT** authentication with bcrypt
- **CORS** enabled for flexible client origins

### Shared
- **Zod** for schema validation
- Type-safe shared algorithms and utilities

## Project Structure

```
mindcheck-monorepo/
├── apps/
│   ├── client/                 # React frontend
│   │   ├── src/
│   │   │   ├── pages/         # Route pages (Dashboard, CheckIn, Journal, etc.)
│   │   │   ├── components/    # UI components (StressRing, BreathingCircle, etc.)
│   │   │   ├── hooks/         # Custom hooks (useTheme)
│   │   │   ├── lib/           # Utilities (api, storage, date, design-system)
│   │   │   └── App.tsx        # Main app with routing
│   │   └── package.json
│   └── server/                 # Express backend
│       ├── src/
│       │   ├── routes/        # API endpoints (auth, checkins, dashboard, etc.)
│       │   ├── middleware/    # Auth middleware
│       │   ├── services/      # Data repositories
│       │   ├── db/            # Database client and migrations
│       │   ├── utils/         # Helpers (date, auth)
│       │   ├── app.ts         # Express setup
│       │   ├── index.ts       # Server entry
│       │   └── config.ts      # Environment config
│       └── package.json
└── packages/
    └── shared/                 # TypeScript types, schemas, algorithms
        ├── src/
        │   ├── types.ts       # All core types (User, CheckIn, Dashboard, etc.)
        │   ├── schemas/       # Zod validation schemas
        │   ├── lib/           # Core logic (stress calculation, suggestions, analytics)
        │   └── content/       # Relief library and guidance
        └── package.json
```

## Getting Started

### Prerequisites
- Node.js 22+ (or 20+)
- npm 10+

### Installation

```bash
# Install dependencies across all workspaces
npm install

# Development: run client (Vite) and server in parallel
npm run dev

# Client will be available at http://localhost:5173
# Server will be available at http://localhost:4000
```

### Build & Deploy

```bash
# Build all packages
npm run build

# Output: client builds to /public, server builds to /dist

# Test across all workspaces
npm run test
```

### Environment Variables

Create a `.env` file in the root (or `.env.local` for local overrides):

```bash
# Server
PORT=4000
JWT_SECRET=your-secret-key-here
DATABASE_PATH=apps/server/data/mindcheck.db
CLIENT_ORIGIN=http://localhost:5173

# Optional (auto-detected in Vercel)
# VERCEL=1
```

See `.env.example` for all available options.

## API Endpoints

### Authentication
- `POST /api/auth/signup` — Create account
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout

### Check-ins
- `GET /api/checkins/today?date=YYYY-MM-DD` — Get today's check-ins + suggestions
- `POST /api/checkins` — Create/update check-in

### Dashboard
- `GET /api/dashboard` — Full dashboard data (trends, heatmap, badges, insights)

### Journal
- `GET /api/journal?date=YYYY-MM-DD` — Get journal entries for date
- `POST /api/journal` — Create journal entry

### Pulse
- `GET /api/pulse?date=YYYY-MM-DD` — Get pulse checks
- `POST /api/pulse` — Create pulse check

### Events
- `GET /api/events` — List upcoming events
- `POST /api/events` — Create event
- `DELETE /api/events/:id` — Delete event

### Insights
- `GET /api/dashboard/insights` — Unlock insights after 7 days of data

## Stress Scoring Algorithm

Stress score is calculated from 0-100 based on:

```
sleep (25%) + workload (25%) + mood (20%) + activity (15%) + meals (10%) + social (5%)
```

**Sleep stress**: Hours and quality penalize heavily—both too little and too much register as stress.
**Workload**: Heavy/overwhelming workload increases stress proportionally.
**Mood**: Negative moods (sad, uneasy) increase stress; positive moods reduce it.
**Activity**: Sedentary patterns increase stress; exercise reduces it.
**Meals**: Skipped or imbalanced meals add stress.
**Social**: Isolation increases stress; social connection reduces it.

Scores are banded into levels: **low** (0-30), **moderate** (31-60), **high** (61-80), **critical** (81-100).

## Relief Suggestions

The app suggests from a curated library of 15 relief strategies across 13 categories:

- **Breathing** — Box breathing, guided calm scripts
- **Stretch** — Neck/shoulder tension relief
- **Journal** — Reflective prompts
- **Music** — Lo-fi and calm playlists
- **Micro-habits** — Small actionable next steps
- **Talk it out** — Self-reflection questions
- **Sleep** — Sleep protection and debt recovery
- **Focus** — Pomodoro blocks, protected focus windows
- **Anxiety** — Pre-exam calm scripts
- **Rest** — Permission to pause
- **Support** — Reach out, professional resources
- **Boundary** — Wind-down rituals
- **Planning** — Meeting load management

Suggestions are personalized based on stress patterns, upcoming events, sleep debt, and burnout status.

## Design System & Components

### Glassmorphism Design

MindCheck uses a modern **glassmorphism design system** with:

- **Glass effect**: Backdrop blur, semi-transparent backgrounds, and layered shadows create depth
- **Theme variables**: Light and dark modes with CSS custom properties for consistent colors across the app
- **Smooth animations**: Framer Motion for entrance, hover, and interactive states
- **Accessible spacing**: Standardized gaps (space-1 through space-8) and border radii

### Shared Component Library

Core UI components live in `apps/client/src/components/` and are reused across all pages:

**Glass Components** (glassmorphism-styled):
- `GlassCard` — Base glass effect container with variants (default, accent, elevated, subtle)
- `GlassMetric` — Stat card with label, value, icon, and trend indicator
- `GlassStat` — Animated progress stat with bar fill and percentage
- `GlassButton` — Button with glass, primary, secondary, or ghost variants
- `GlassFormSection` — Form container with title and description

**UI Components**:
- `StressRing` — Circular progress visualization of stress score (0-100)
- `BreathingCircle` — Animated box breathing guide (inhale, hold, exhale)
- `CheckinProgressBar` — Step progress indicator for multi-step flows
- `MoodPicker` — Emoji-based mood selection grid
- `StressorChips` — Multi-select chip buttons for stressor categories
- `JournalCard` — Card for journal entry preview with date and tone
- `BadgeCard` — Achievement badge with lock state
- `TipCard` — Wisdom/guidance card with optional icon
- `ThemeToggle` — Light/dark mode switcher

**Other Components**:
- `MetricCard` — Simple metric display (used on dashboard)
- `Layout` — App shell with header, nav, and footer
- `ReliefSuggestionCard` — Relief suggestion with icon, description, steps, and CTA
- `StaggerItem` — Wrapper for staggered entrance animations

### Theming

Light and dark themes are defined via CSS custom properties in `apps/client/src/styles.css`:

```css
--bg-base        /* Page background */
--bg-surface     /* Surface layer */
--bg-elevated    /* Elevated component */
--accent-primary /* Primary color (sage green) */
--accent-secondary /* Secondary color (warm tan) */
--text-primary   /* Body text */
--text-muted     /* Muted/secondary text */
--glass-bg       /* Glass effect background */
--glass-border   /* Glass effect border */
```

Theme is stored in `localStorage` and applied via `data-theme` attribute on `<html>`. The `useTheme()` hook manages toggling.

## Design Philosophy

MindCheck prioritizes:

- **Compassion**: Warm, non-judgmental language. Stress is normalized and treated as human.
- **Simplicity**: 2-minute check-ins, small relief actions, no overwhelming features.
- **Calm**: Nature-inspired design, soft animations, intentional color palettes.
- **Context**: Suggestions adapt to personal patterns, events, and burnout risk.
- **Agency**: Users choose their own pace—no forced gamification, genuine achievement.

## Development

### Scripts

```bash
npm run dev              # Start dev server (client + server in parallel)
npm run dev:client      # Start Vite dev server only
npm run dev:server      # Start Express server only
npm run build           # Build all workspaces
npm run test            # Run all tests
npm test:client         # Test React components
npm test:server         # Test API routes
npm test:shared         # Test algorithms
```

### Testing

Tests are written with **Vitest** and **@testing-library/react**:

```bash
# Run all tests once
npm run test

# Watch mode (in development)
npm run dev:server  # starts with --watch for TypeScript
```

## Deployment

### Vercel (Recommended)

1. Connect repository to Vercel
2. Set environment variables (JWT_SECRET, etc.)
3. Vercel auto-detects monorepo and runs `npm run build`
4. Client output goes to `/public`, served as static site
5. API routes handled by Express server

### Self-Hosted

1. Build: `npm run build`
2. Start server: `node dist/index.js` (set `DATABASE_PATH` to persistent location)
3. Client is in `/public` and served by Express

## Contributing

Contributions welcome. Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run tests: `npm run test`
5. Commit with clear messages
6. Push and open a PR

## License

MIT

## Support

For issues, questions, or feedback, open an issue on GitHub or reach out directly.

---

Built with care for people managing stress. MindCheck recognizes that some days are hard, some weeks are heavy, and that's okay. 💙
