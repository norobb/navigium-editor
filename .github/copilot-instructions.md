# Navigium Punkte-Editor - AI Coding Guidelines

## Project Overview
This is a React SPA for managing points in the Navigium Latin/Greek learning platform. It provides a dashboard interface for authenticated users to view and modify their learning progress points through an n8n webhook API.

## Architecture & Data Flow
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui components
- **Backend**: External n8n webhook API at `https://n8n.nemserver.duckdns.org/webhook/navigium`
- **Auth**: Session-based with localStorage persistence, auto-refresh every 5 minutes
- **State**: React Query for server state, localStorage for session persistence
- **Routing**: React Router with `/` (login) and `/dashboard` routes

## Key Patterns & Conventions

### API Integration (`src/lib/navigium-api.ts`)
- All API calls logged in-memory with request/response details
- Custom `makeRequest()` wrapper handles logging, error handling, and JSON parsing
- Session management: `getSession()`, `saveSession()`, `clearSession()`
- Auto-login refresh: `refreshLogin()` called every 5 minutes in dashboard
- API key: `"BANANA"` hardcoded as `x-internal-key` header

### Component Structure
- Pages in `src/pages/`: `Login.tsx`, `Dashboard.tsx`, `NotFound.tsx`
- UI components from shadcn/ui in `src/components/ui/`
- Custom components: `RequestLog.tsx` (collapsible API request logger)
- Path aliases: `@/` maps to `src/`

### Authentication Flow
```typescript
// Login process stores credentials for session refresh
saveSession({
  username: response.username,
  password, // Store password for auto-refresh
  lang,
  aktuellerKarteikasten: response.aktuellerKarteikasten,
  gesamtpunkteKarteikasten: response.gesamtpunkteKarteikasten,
});
```

### Logging System
- In-memory log storage with max 100 entries
- Logs include: timestamp, request headers, response status/data, errors
- Console logging with `[TYPE]` prefixes
- `RequestLog` component displays logs in collapsible format

### UI Patterns
- German interface text despite English code/comments
- Toast notifications for user feedback
- Loading states with `Loader2` spinner
- Form validation with error toasts
- Responsive design with Tailwind classes

## Development Workflow

### Build Commands
- `npm run dev` - Start dev server on port 8080
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run lint` - ESLint checking

### Key Files to Reference
- `src/lib/navigium-api.ts` - Core API logic and session management
- `src/pages/Dashboard.tsx` - Main functionality (points management)
- `src/components/RequestLog.tsx` - API logging UI
- `vite.config.ts` - Build config with path aliases
- `components.json` - shadcn/ui configuration

## Integration Points
- **n8n Webhook**: Primary backend for login/setpoints/getpoints operations
- **Supabase**: Configured but not actively used (empty schema)
- **Local Storage**: Session persistence across browser refreshes

## Common Patterns
- Error handling: Try/catch with toast notifications
- Loading states: `isLoading` boolean with disabled inputs
- Data fetching: React Query (though minimally used currently)
- Form handling: Controlled components with `useState`
- Navigation: `useNavigate` hook from React Router

## Security Notes
- Password stored in localStorage for session refresh (acceptable for this use case)
- API key hardcoded (consider environment variables for production)
- No client-side validation beyond basic form requirements</content>
<parameter name="filePath">c:\Users\marya\coding\navigium_app\navigium-editor\.github\copilot-instructions.md