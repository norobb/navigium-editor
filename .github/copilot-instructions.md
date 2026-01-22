# Navigium Punkte-Editor - AI Coding Guidelines

## Project Overview
This is a React SPA for managing points in the Navigium Latin/Greek learning platform. It provides a dashboard interface for authenticated users to view and modify their learning progress points through an n8n webhook API. The application includes multi-layered security with app-level password gate and admin panel for managing users and greetings.

## Architecture & Data Flow
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui components
- **Backend**: External n8n webhook API at `https://n8n.nemserver.duckdns.org/webhook/navigium`
- **Auth**: Multi-layered authentication with app password gate + session-based auth with localStorage persistence
- **Session**: Auto-refresh every 5 minutes with encrypted session storage
- **Encryption**: AES-256 encryption for sensitive data in localStorage (sessions, passwords, greetings, users)
- **State**: React Query for server state, localStorage for persistent data
- **Routing**: React Router with `/` (login), `/dashboard`, `/admin` (protected) routes

## Key Patterns & Conventions

### API Integration (`src/lib/navigium-api.ts`)
- All API calls logged in-memory with request/response details
- Custom `makeRequest()` wrapper handles logging, error handling, and JSON parsing
- **Session management**: 
  - `getSession()`, `saveSession()`, `clearSession()` - encrypted storage with migration support
  - Auto-login refresh: `refreshLogin()` called every 5 minutes in dashboard
  - Session data: username, password, language, current and total points
- **App Password Management**:
  - `getAppPassword()`, `setAppPassword()`, `authenticateApp()`, `clearAppAuth()`
  - Server sync: `syncAppPasswordToServer()`, `getAppPasswordFromServer()`
  - Default password: `"cheater2025"` (hardcoded fallback)
  - Supports local fallback if server unavailable
- **User Greetings Management**:
  - `getGreetings()`, `getGreetingForUser()`, `setGreetingForUser()`
  - Server sync: `syncGreetingToServer()`, `getGreetingsFromServer()`
  - Fallback to localStorage if server unavailable
- **Known Users Management**:
  - `getKnownUsers()`, `saveKnownUsers()`, `addKnownUser()`
  - Stores user list in encrypted localStorage
- **Encryption**: AES-256 using `crypto.ts` utilities for all sensitive data
- **Admin Check**: `isAdmin()` checks if current user is `"mahyno2022"`
- API key: `"BANANA"` hardcoded as `x-internal-key` header

### Component Structure
- Pages in `src/pages/`: `Login.tsx`, `Dashboard.tsx`, `AdminPanel.tsx`, `Index.tsx`, `NotFound.tsx`
- Middleware: `AppPasswordGate.tsx` (app-level authentication wrapper)
- UI components from shadcn/ui in `src/components/ui/`
- Custom components: `RequestLog.tsx` (API logger), `ThemeToggle.tsx` (dark mode), `NavLink.tsx`
- Path aliases: `@/` maps to `src/`

### Authentication Flow
```typescript
// App Password Gate (wraps entire app)
1. AppPasswordGate checks localStorage "app_authenticated"
2. If not authenticated, user must enter app password
3. authenticateApp() verifies password and sets localStorage flag

// Login process (stores credentials for session refresh)
4. User enters username, password, language
5. Login request to n8n API
6. Session stored in encrypted localStorage:
   - navigium_session_v2 (encrypted UserSession)
7. Password stored for auto-refresh (every 5 minutes)
8. refreshLogin() keeps session current
```

### Logging System
- In-memory log storage with max 100 entries
- Log types: `'login' | 'setpoints' | 'points' | 'password' | 'getpassword' | 'greeting' | 'greetings'`
- Logs include: timestamp, request headers, response status/data, errors
- Console logging with `[TYPE]` prefixes (uppercase)
- `RequestLog` component displays logs in collapsible format
- Accessible via `getLogs()` and `clearLogs()`

### UI Patterns
- German interface text despite English code/comments
- Toast notifications for user feedback
- Loading states with `Loader2` spinner
- Form validation with error toasts
- Responsive design with Tailwind classes
- Dark mode support via `ThemeProvider` and `ThemeToggle` component

## Development Workflow

### Build Commands
- `npm run dev` - Start dev server on port 8080
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run lint` - ESLint checking

### Key Files to Reference
- `src/lib/navigium-api.ts` - Core API logic, session/auth/greeting/user management
- `src/lib/crypto.ts` - AES-256 encryption utilities for sensitive data
- `src/pages/Dashboard.tsx` - Main functionality (points management, session refresh)
- `src/pages/AdminPanel.tsx` - Admin features (users, greetings, app password)
- `src/components/AppPasswordGate.tsx` - App-level authentication wrapper
- `src/components/RequestLog.tsx` - API logging UI
- `src/hooks/use-theme.tsx` - Dark mode theme provider
- `vite.config.ts` - Build config with path aliases
- `components.json` - shadcn/ui configuration

## Integration Points
- **n8n Webhook**: Primary backend for:
  - `login` - User authentication
  - `setpoints` - Update points (add/subtract)
  - `points` - Get current user points
  - `password` - Set app password on server
  - `getpassword` - Retrieve app password from server
  - `greeting` - Set greeting for user on server
  - `greetings` - Get all user greetings from server
- **Supabase**: Configured but not actively used (empty schema, placeholder for future)
- **Local Storage**: Session persistence across browser refreshes
  - `navigium_session_v2` - Encrypted user session
  - `app_password_v2` - Encrypted app password
  - `user_greetings_v2` - Encrypted user greetings
  - `known_users_v2` - Encrypted user list
  - `app_authenticated` - Boolean flag for app password gate
  
## n8n API Endpoints

All endpoints use GET method with query parameters and require `x-internal-key: BANANA` header.

```
Base URL: https://n8n.nemserver.duckdns.org/webhook/navigium

Parameters (all lowercase):
- user: username
- password: user password
- lang: language code (default "LA")
- diff: points difference (for setpoints)
- greeting: greeting text (for greeting endpoint)

Expected Responses:
- login: { username, aktuellerKarteikasten, gesamtpunkteKarteikasten }
- setpoints: { aktuellerKarteikasten, gesamtpunkteKarteikasten }
- points: { aktuellerKarteikasten, gesamtpunkteKarteikasten }
- password: { status: "success" } (or similar)
- getpassword: { password: string }
- greeting: { status: "success" }
- greetings: [ { user: string, greeting: string }, ... ]
```

## Common Patterns
- Error handling: Try/catch with toast notifications and fallback to localStorage
- Loading states: `isLoading` boolean with disabled inputs
- Data fetching: React Query (though minimally used currently)
- Form handling: Controlled components with `useState`
- Navigation: `useNavigate` hook from React Router
- Session validation: Check for session on protected routes, redirect to login if missing
- Server sync: Try server first, fallback to localStorage if server unavailable

## Security Notes
- Password stored in localStorage for session refresh (acceptable for this use case)
- All sensitive data encrypted with AES-256
- API key hardcoded as `"BANANA"` (consider environment variables for production)
- App password and greetings synced with server but cached locally
- Admin user hardcoded as `"mahyno2022"` 
- No client-side validation beyond basic form requirements</content>
<parameter name="filePath">c:\Users\marya\coding\navigium_app\navigium-editor\.github\copilot-instructions.md