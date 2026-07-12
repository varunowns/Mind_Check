# Pebble Architecture

## System Overview

Pebble is a **monorepo-based full-stack application** designed with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React/Vite)                       │
│  Dashboard | CheckIn | Journal | Pulse | Insights | Settings   │
│            (http://localhost:5173)                              │
└────────────────────┬────────────────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────────────────┐
│                  Backend (Express/Node.js)                      │
│  /api/auth  /api/checkins  /api/dashboard  /api/journal        │
│  /api/pulse  /api/events  /api/sync  (http://localhost:4000)   │
└────────────────────┬────────────────────────────────────────────┘
                     │ SQL
┌────────────────────▼────────────────────────────────────────────┐
│              Data Layer (SQLite + WAL)                          │
│  Users | CheckIns | Results | Pulse | Journal | Events          │
└─────────────────────────────────────────────────────────────────┘

         Shared Types, Schemas, Algorithms
              (@pebble/shared package)
```

## Core Layers

### 1. Presentation Layer (Frontend)

**Technologies**: React 19, Vite, Tailwind CSS, Framer Motion

**Key Directories**:
- `apps/client/src/pages/` — Route-level page components (CheckInPage, DashboardPage, etc.)
- `apps/client/src/components/` — Reusable UI components (StressRing, MoodPicker, BreathingCircle)
- `apps/client/src/lib/` — Client utilities (API client, storage, design system, helpers)
- `apps/client/src/hooks/` — Custom React hooks

**Design System** (`design-system.ts`):
- Tone mapping: stress scores → visual/textual tone (critical, high, moderate, low)
- Component library exported from `mindcheck-ui.tsx`
- Tailwind token system for consistency
- Animations via Framer Motion for calming effects

**State Management**:
- React Context for theme (light/dark)
- Local component state for forms
- Browser localStorage for offline fallback (guest mode)
- React Router for navigation

### 2. API Layer (Backend)

**Technologies**: Express.js, TypeScript, JWT, bcryptjs

**Route Structure** (`src/routes/`):
- `auth.ts` — Sign up, login, logout
- `checkins.ts` — Create/read check-ins, generate suggestions
- `dashboard.ts` — Aggregate insights, trends, heatmaps
- `journal.ts` — Create/read journal entries
- `pulse.ts` — Quick mood/focus snapshots
- `events.ts` — Upcoming events (exams, deadlines)
- `sync.ts` — Offline-first sync endpoint

**Middleware** (`src/middleware/`):
- `auth.ts` — JWT validation, user context injection

**Error Handling**:
- Consistent JSON error responses
- Input validation via Zod (fail-fast on bad data)
- Graceful database error handling

### 3. Data Layer (Database)

**Technology**: SQLite with WAL mode

**Schema**:
```sql
users (id, email, name, checkinMode, recommendedSleepHours, ...)
checkins (id, userId, date, mood, sleepHours, workload, stressScore, ...)
results (id, userId, checkinId, context, suggestions, ...)
pulse (id, userId, date, mood, focus, ...)
journal (id, userId, date, content, prompt, wordCount, ...)
events (id, userId, title, date, type, ...)
burnout_warnings (id, userId, avgScore, daysCount, ...)
shields (id, userId, usedOn, ...)
```

**Key Decisions**:
- WAL mode for concurrent read/write performance
- Denormalized `results` table for fast dashboard queries (pre-computed context)
- Date fields stored as ISO strings for timezone-agnostic handling
- `stressScore` stored on check-in for historical accuracy

### 4. Business Logic Layer (Shared)

**Package**: `@mindcheck/shared`

**Core Algorithms** (`src/lib/`):

#### Stress Calculation (`stressScore.ts`)
```typescript
score = 
  sleep(25%) + workload(25%) + mood(20%) + activity(15%) + meals(10%) + social(5%)
```
- Sleep: penalizes hours <4 or >9, quality inversely proportional
- Workload: linear mapping (light→10, moderate→40, heavy→70, overwhelming→90)
- Mood: (sad→90, uneasy→70, neutral→50, okay→30, happy→10)
- Activity, meals, social: similar mappings
- Output: 0-100 score + band (low/moderate/high/critical)

#### Suggestion Logic (`suggestions.ts`)
- Context-aware: checks sleep debt, upcoming events, burnout status
- Deduplicated: no repeat suggestions
- Category-based: 13 categories, 15+ options in relief library
- Fallback: always returns at least 1 suggestion

#### Analytics (`analytics.ts`)
- Streak calculation (consecutive days with check-in)
- Weekly averages
- Trend detection (improving vs. worsening)
- Badge logic (7-day streak, stress buster, early bird)

### 5. Shared Types

**Key Types** (`types.ts`):
- `CheckInInput` — User-submitted check-in data
- `CheckInRecord` — Stored with computed stressScore
- `DashboardSummary` — All dashboard data
- `ReliefSuggestion` — Suggestion object
- `User` — User account
- `BurnoutWarning` — Triggered when avg score >75 for 5+ days

**Schemas** (`schemas/`):
- Zod schemas for runtime validation on server and client
- Ensures type safety across network boundary

## Data Flow

### Daily Check-in Flow

```
1. User completes check-in form (mood, sleep, workload, etc.)
   └─> React form component validates locally

2. POST /api/checkins
   ├─ Server validates with checkInSchema
   ├─ Computes stressScore via calculateStressScore()
   ├─ Stores CheckInRecord in database
   ├─ Generates relief suggestions via generateReliefSuggestions()
   ├─ Computes context (activeEvent, sleepDebt, burnout status)
   └─ Returns CheckInRecord + suggestions + context

3. Client receives response
   ├─ Displays StressRing with score
   ├─ Shows personalized relief suggestions
   ├─ Offers journal prompt based on patterns
   └─ Stores locally for offline access
```

### Dashboard Load Flow

```
1. GET /api/dashboard
   ├─ Fetches all user's check-ins (last 90 days)
   ├─ Computes trends, averages, heatmap
   ├─ Checks burnout status (avg last 5 days)
   ├─ Calculates sleep debt vs. recommended hours
   ├─ Evaluates badges (streaks, stress buster)
   ├─ Fetches upcoming events
   ├─ Computes pre-exam stress patterns
   └─ Aggregates into DashboardSummary

2. Client renders:
   ├─ Weekly trend graph (recharts)
   ├─ Stress heatmap
   ├─ Badges (locked/unlocked)
   ├─ Upcoming events
   ├─ Sleep debt warning
   ├─ Burnout shield status
   └─ Quick access to pulse, journal, insights
```

## Key Design Patterns

### 1. Repository Pattern (`services/repositories.ts`)

All database access goes through repositories:
```typescript
checkInRepository.upsert(userId, data)
resultRepository.getContext(userId, record)
userRepository.refreshWeeklyShield(userId)
```

Benefits:
- Centralized data access logic
- Easy to mock for testing
- Consistent error handling

### 2. Middleware Composition

Auth middleware injects `userId` into request:
```typescript
app.use("/api/protected", requireAuth);
checkInRouter.use(requireAuth);  // All routes require auth
```

### 3. Offline-First Design

Client stores check-ins in localStorage:
```typescript
const guestCheckIns = storage.getGuestCheckIns()  // Before login
// When user logs in, syncs via POST /api/sync
```

### 4. Immutable Data Structures

Types use `readonly` arrays and never mutate:
```typescript
export type Badge = {
  id: "seven-day-streak" | "stress-buster" | "early-bird";
  title: string;
  earned: boolean;
};  // No setters; computed fresh each time
```

## Performance Considerations

### Database
- **WAL mode**: Concurrent reads while writes happen
- **Indexes**: On `(userId, date)` for fast check-in lookups
- **Denormalization**: `results` table pre-computes expensive context

### Frontend
- **Code splitting**: Vite auto-splits route bundles
- **Animations**: Framer Motion uses CSS transforms (60fps)
- **Local storage**: Reduces API calls on repeated visits

### Backend
- **Compression**: Express gzip middleware (if deployed)
- **Caching**: Dashboard data cached client-side for same-day views
- **Query optimization**: Batch fetches where possible

## Security

### Authentication
- JWT tokens (HS256 with secret)
- Bcrypt password hashing (10 rounds)
- Token expiry (if implemented: refresh tokens)

### Input Validation
- All inputs validated with Zod schemas server-side
- SQL injection prevented by SQLite prepared statements
- CORS enabled only for configured client origin

### Data Privacy
- No personal health data logged
- Stress scores are local computation
- Database path configurable (Vercel: /tmp; self-hosted: persistent)

## Testing Strategy

### Unit Tests
- Stress algorithm edge cases
- Suggestion logic deduplication
- Analytics calculations

### Integration Tests
- API endpoint validation
- Database transactions
- Auth flow

### Component Tests
- Form input validation
- Theme toggle
- Stress ring animation

Run all tests: `npm run test`

## Deployment

### Development
```bash
npm install
npm run dev  # http://localhost:5173 + http://localhost:4000
```

### Production (Vercel)
```bash
# Vercel auto-detects monorepo
# Runs: npm run build
# Output: /public → static site, /dist/index.js → serverless function
```

### Self-Hosted
```bash
npm run build
PORT=4000 DATABASE_PATH=/var/lib/mindcheck.db node dist/index.js
```

## Future Considerations

- **Real-time sync**: WebSockets for multi-device updates
- **Notifications**: Server-sent events for reminders
- **Export**: CSV/PDF data export for users
- **Analytics**: Aggregate insights (anonymized, opt-in)
- **Internationalization**: i18n for multiple languages
- **Mobile app**: React Native version
- **AI features**: LLM-powered insight generation
