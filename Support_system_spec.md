# Support Ticket System — Full Implementation Spec

> **Purpose:** Reproduce the in-app support ticket system in another project.
> Covers: floating widget, ticket management page, backend API, auth, database, file uploads, Docker deployment to Northflank.

---

## 1. Overview

An in-app support system that lets users submit bug reports, improvement suggestions, questions, and general feedback via a floating chat-style widget. Submissions are stored in a SQLite database with optional file attachments. An admin page lists all tickets with filtering, status management, and a comments thread.

### System Diagram

```
┌──────────────────────────────────────────────────────────┐
│  Browser                                                 │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │  SupportWidget   │  │  SupportPage (/support)      │  │
│  │  (floating, z-50)│  │  Table + Detail panels       │  │
│  └────────┬─────────┘  └───────────┬──────────────────┘  │
│           │                        │                     │
│           └────────┬───────────────┘                     │
│                    │  support-api.ts + auth.ts            │
│                    │  (Authorization: Bearer {token})     │
└────────────────────┼─────────────────────────────────────┘
                     │ HTTPS
┌────────────────────┼─────────────────────────────────────┐
│  Northflank         │  Container (port 8000)             │
│  ┌──────────────────▼──────────────────────────────────┐ │
│  │  FastAPI (uvicorn)                                  │ │
│  │  ├─ AuthMiddleware (gates /api/* except public)     │ │
│  │  ├─ POST/GET  /api/auth/*                           │ │
│  │  ├─ CRUD      /api/support/*                        │ │
│  │  ├─ Static    /api/support/uploads/* (file serving) │ │
│  │  └─ Static    /* (React SPA, html=True)             │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Persistent Volume (/data)                          │ │
│  │  ├─ support.db  (SQLite)                            │ │
│  │  └─ uploads/    (screenshot + attachment files)     │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

### Backend
| Dependency | Version | Purpose |
|---|---|---|
| `fastapi` | >=0.115.0 | API framework |
| `uvicorn[standard]` | >=0.34.0 | ASGI server |
| `sqlalchemy` | >=2.0.0 | ORM (async) |
| `aiosqlite` | >=0.20.0 | Async SQLite driver |
| `python-multipart` | >=0.0.18 | Form/file upload parsing |
| `pydantic` | >=2.0.0 | Request/response validation |

### Frontend
| Dependency | Purpose |
|---|---|
| `react` ^19 | UI framework |
| `html2canvas` ^1.4.1 | Auto-capture page screenshots |
| `lucide-react` | Icons (Bug, Lightbulb, HelpCircle, etc.) |
| `tailwindcss` ^4 | Styling |
| shadcn/ui components | Badge, Button, Dialog, Input, Select, Table, Textarea, Tooltip |

---

## 3. Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DEMO_PASSWORD` | **Yes** | *(none — app crashes without it)* | Password for the login page |
| `DATABASE_URL` | No | `sqlite+aiosqlite:////data/support.db` | SQLAlchemy async connection string |
| `UPLOAD_DIR` | No | `/data/uploads` | Directory for uploaded files |
| `MAX_UPLOAD_SIZE` | No | `10485760` (10 MB) | Max file upload size in bytes |
| `STATIC_DIR` | No | `static` | Directory containing the React build |

---

## 4. Database Schema

### Tables

#### `auth_tokens`
| Column | Type | Constraints |
|---|---|---|
| `token` | VARCHAR(64) | **PK** |
| `expires_at` | FLOAT | NOT NULL (unix timestamp) |

#### `support_tickets`
| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | **PK**, autoincrement |
| `ticket_type` | VARCHAR(20) | NOT NULL — `bug`, `improvement`, `question`, `other` |
| `message` | TEXT | NOT NULL |
| `submitted_by` | VARCHAR(255) | NOT NULL — submitter email |
| `tagged_email` | VARCHAR(255) | nullable |
| `page_url` | VARCHAR(500) | nullable — e.g. `/inventory` |
| `browser_info` | TEXT | nullable — `navigator.userAgent` |
| `status` | VARCHAR(20) | NOT NULL, default `open` — `open`, `in_progress`, `resolved`, `closed` |
| `created_at` | DATETIME | NOT NULL, default UTC now |
| `updated_at` | DATETIME | NOT NULL, default UTC now |
| `screenshot_path` | VARCHAR(500) | nullable — filename in uploads dir |
| `attachment_path` | VARCHAR(500) | nullable — filename in uploads dir |

**Indexes:** `idx_tickets_status`, `idx_tickets_type`, `idx_tickets_created`

#### `ticket_comments`
| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | **PK**, autoincrement |
| `ticket_id` | INTEGER | **FK** → `support_tickets.id`, NOT NULL |
| `text` | TEXT | NOT NULL |
| `created_at` | DATETIME | NOT NULL, default UTC now |

**Index:** `idx_comments_ticket` on `ticket_id`

### Table creation

All tables are created idempotently on app startup via `Base.metadata.create_all` inside the FastAPI lifespan handler. No migration tool required.

---

## 5. Backend API

### 5.1 Authentication

Simple demo-grade password → token flow. Tokens are persisted in SQLite (not in-memory) so they survive container restarts.

**Token TTL:** 7 days (`60 * 60 * 24 * 7` seconds)

**Token format:** `secrets.token_urlsafe(32)`

#### `POST /api/auth/login`
- **Public** (no auth required)
- **Body:** `{ "password": "string" }`
- **200:** `{ "token": "string" }`
- **401:** `{ "detail": "Invalid password" }`
- Uses constant-time comparison (`secrets.compare_digest`)

#### `POST /api/auth/verify`
- **Public**
- **Query param:** `token=string`
- **200:** `{ "valid": true|false }`

### 5.2 Auth Middleware

A Starlette `BaseHTTPMiddleware` that:
1. Only gates routes starting with `/api/`
2. Skips public prefixes: `/api/health`, `/api/auth/`
3. Reads `Authorization: Bearer {token}` header
4. Calls `validate_token(token)` against the database
5. Returns `401 {"detail": "Unauthorized"}` if invalid

### 5.3 Support Ticket Endpoints

All endpoints require Bearer token auth.

#### `POST /api/support` — Create ticket
- **Content-Type:** `multipart/form-data`
- **Form fields:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `ticket_type` | string (enum) | Yes | `bug`, `improvement`, `question`, `other` |
| `message` | string | Yes | 1–5000 chars |
| `submitted_by` | string | Yes | 1–255 chars |
| `tagged_email` | string | No | |
| `page_url` | string | No | |
| `browser_info` | string | No | |
| `screenshot` | File | No | Max 10 MB, allowed extensions |
| `attachment` | File | No | Max 10 MB, allowed extensions |

- **Allowed file extensions:** `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.pdf`, `.txt`, `.csv`
- **File naming:** `{ticket_id}_{prefix}_{uuid_8chars}.{ext}` (e.g. `42_screenshot_a1b2c3d4.png`)
- **201:** Returns full `TicketResponse`

#### `GET /api/support` — List tickets
- **Query params:** `ticket_type?`, `status?`, `limit=50`, `offset=0`
- **200:** `{ "tickets": [...], "total": N, "limit": N, "offset": N }`
- Sorted by `created_at` DESC

#### `GET /api/support/{ticket_id}` — Get ticket
- **200:** `TicketResponse`
- **404:** if not found

#### `PATCH /api/support/{ticket_id}` — Update status
- **Body:** `{ "status": "open|in_progress|resolved|closed" }`
- **200:** Updated `TicketResponse`
- Explicitly sets `updated_at` (SQLite + aiosqlite may not trigger `onupdate`)

#### `POST /api/support/{ticket_id}/comments` — Add comment
- **Body:** `{ "text": "string" }` (1–5000 chars)
- **201:** `CommentResponse`
- Also bumps ticket's `updated_at`

#### `GET /api/support/{ticket_id}/comments` — List comments
- **200:** `CommentResponse[]` ordered by `created_at` ASC

### 5.4 TicketResponse Shape

```json
{
  "id": 1,
  "ticket_type": "bug",
  "message": "The chart doesn't load",
  "submitted_by": "user@example.com",
  "tagged_email": "colleague@example.com",
  "page_url": "/forecast",
  "browser_info": "Mozilla/5.0 ...",
  "status": "open",
  "created_at": "2026-04-09T15:56:08.000000",
  "updated_at": "2026-04-09T15:56:08.000000",
  "screenshot_url": "/api/support/uploads/1_screenshot_a1b2c3d4.png",
  "attachment_url": null
}
```

### 5.5 File Serving

Uploaded files are served via a Starlette `StaticFiles` mount at `/api/support/uploads`.

---

## 6. Backend: Mount Order (Critical)

The order of router inclusion and `app.mount()` calls matters. Starlette's catch-all static mount will intercept non-GET requests if it matches first.

```python
# 1. API routes — MUST come before static mounts
app.include_router(auth_router, prefix="/api/auth")
app.include_router(support_router, prefix="/api/support")

# 2. Upload file serving
app.mount("/api/support/uploads", StaticFiles(directory=UPLOAD_DIR))

# 3. React SPA catch-all — MUST be LAST
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True))
```

### Trailing Slash Pitfall

Routes **must** use empty string paths (`""`) not `"/"` for root-level router endpoints:

```python
# CORRECT — matches /api/support exactly
@router.post("", response_model=TicketOut)
@router.get("", response_model=TicketList)

# WRONG — matches /api/support/ (trailing slash)
# The catch-all static mount intercepts /api/support (no slash) first → 405
@router.post("/", ...)
@router.get("/", ...)
```

This is because:
1. Frontend sends `POST /api/support` (no trailing slash)
2. FastAPI tries to 307 redirect to `/api/support/`
3. The catch-all `StaticFiles(html=True)` intercepts the redirect
4. StaticFiles only supports GET/HEAD → **405 Method Not Allowed**

---

## 7. Backend: CORS

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

CORS middleware must be added **before** the auth middleware.

---

## 8. Frontend: Auth System

### Token Storage

- **Key:** `springfield_demo_token` (or any consistent key)
- **Storage:** `sessionStorage` (cleared when tab closes — acceptable for a demo)

### Auth Module (`lib/auth.ts`)

```typescript
const TOKEN_KEY = 'springfield_demo_token';

function getToken(): string | null
function setToken(token: string): void
function clearToken(): void
function forceLogout(): void       // clearToken() + window.location.reload()
function authHeaders(extra?): Record<string, string>
    // → { Authorization: `Bearer ${token}`, ...extra }
function handleUnauthorized(res: Response): Response
    // If res.status === 401 → forceLogout()
```

### Auth Context (`App.tsx`)

```typescript
const AuthContext = createContext<{ logout: () => void }>({ logout: () => {} });
export function useAuth() { return useContext(AuthContext); }
```

Provided at the top level. The `logout` function calls `clearToken()` and sets token state to `null`, which renders the `LoginPage`.

### Login Flow

1. User enters password on `LoginPage`
2. `POST /api/auth/login` with `{ password }`
3. On 200 → `setToken(data.token)` → sessionStorage → app renders main routes
4. On 401 → show "Incorrect password"

### 401 Auto-Recovery

Every API call wraps its `fetch` response with `handleUnauthorized()`. If any API call returns 401, the app clears the stale token and reloads to the login page. This handles container restarts that wipe tokens (though with the DB-persisted tokens, this is now a fallback).

### Logout Button

A `LogOut` icon button in the sidebar footer, next to the user avatar. Calls `useAuth().logout()`.

---

## 9. Frontend: API Client (`lib/support-api.ts`)

All functions use `authHeaders()` and wrap responses with `handleUnauthorized()`.

```typescript
const API_BASE = '/api/support';

createTicket(payload: CreateTicketPayload): Promise<SupportTicket>
    // POST /api/support — multipart/form-data via FormData

listTickets(params?: { type?, status?, limit?, offset? }): Promise<TicketListResponse>
    // GET /api/support?type=bug&status=open&limit=50&offset=0

getTicket(id: number): Promise<SupportTicket>
    // GET /api/support/{id}

updateTicketStatus(id: number, status: TicketStatus): Promise<SupportTicket>
    // PATCH /api/support/{id} — JSON { status }

addComment(ticketId: number, text: string): Promise<TicketComment>
    // POST /api/support/{ticketId}/comments — JSON { text }

listComments(ticketId: number): Promise<TicketComment[]>
    // GET /api/support/{ticketId}/comments
```

### TypeScript Types (`lib/support-types.ts`)

```typescript
type TicketType = 'bug' | 'improvement' | 'question' | 'other';
type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

interface SupportTicket {
  id: number;
  ticket_type: TicketType;
  message: string;
  submitted_by: string;
  tagged_email: string | null;
  page_url: string | null;
  browser_info: string | null;
  status: TicketStatus;
  created_at: string;       // ISO 8601
  updated_at: string;       // ISO 8601
  screenshot_url: string | null;
  attachment_url: string | null;
}

interface CreateTicketPayload {
  ticket_type: TicketType;
  message: string;
  submitted_by: string;
  tagged_email?: string;
  page_url?: string;
  browser_info?: string;
  screenshot?: File;
  attachment?: File;
}

interface TicketComment {
  id: number;
  ticket_id: number;
  text: string;
  created_at: string;
}

interface TicketListResponse {
  tickets: SupportTicket[];
  total: number;
}
```

---

## 10. Frontend: Support Widget

### Placement
- Fixed position: `bottom-5 right-5`, `z-50`
- Hidden in print: `print:hidden`
- Wrapper has `data-support-widget` attribute (so html2canvas ignores it)

### States & Flow

```
[Closed] → click fab → [Open: Menu]
   ├─ "Report a Bug"         → [Form] → [Submitted]
   ├─ "Suggest Improvement"  → [Form] → [Submitted]
   ├─ "Ask a Question"       → [Form] → [Submitted]
   └─ "Other"                → [Form] → [Submitted]
```

### Menu Step

Four option buttons, each with:
| ID | Icon | Label | Description |
|---|---|---|---|
| `bug` | `Bug` | Report a Bug | Something isn't working correctly |
| `improvement` | `Lightbulb` | Suggest Improvement | An idea to make the system better |
| `question` | `HelpCircle` | Ask a Question | Need help understanding something |
| `other` | `MoreHorizontal` | Other | General feedback or comments |

### Form Step

Selecting an option triggers:
1. **Auto screenshot capture** using `html2canvas`:
   ```typescript
   html2canvas(document.body, {
     ignoreElements: (el) => el.closest("[data-support-widget]") !== null,
     scale: 1,
     logging: false,
     useCORS: true,
   });
   ```
   Result is converted to a `File` object (`page-screenshot.png`).

2. Form fields:
   - **Message textarea** (4 rows, required, placeholder varies by flow type)
   - **Screenshot indicator** — shows "Page captured" with thumbnail, or "Capturing page…"
   - **Attach button** — file input accepting `.png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.csv`
   - **Tagged colleague email** — optional email input
   - **Submit button** — disabled when message empty or submitting, shows spinner

3. On submit, calls `createTicket()` with:
   ```typescript
   {
     ticket_type: flow,                        // "bug" | "improvement" | etc.
     message: message.trim(),
     submitted_by: "user@example.com",         // hardcode or derive from auth context
     tagged_email: email.trim() || undefined,
     page_url: window.location.pathname,
     browser_info: navigator.userAgent,
     screenshot: screenshot ?? undefined,
     attachment: attachment ?? undefined,
   }
   ```

### Submitted Step

- Green check icon
- "Ticket #{id} created"
- "We'll get back to you shortly."
- Close button

### Reset Behavior

Closing the panel or pressing the back arrow resets all state. `URL.revokeObjectURL` is called on the screenshot preview URL to avoid memory leaks.

### Widget Dimensions

- Floating button: `h-12 w-12` rounded-full
- Panel: `w-[340px]`, rounded-xl, border + shadow-xl
- Header: navy-700 background

---

## 11. Frontend: Support Page (`/support`)

### Layout

```
┌─────────────────────────────────────────────────┐
│  Support Tickets               [Refresh]        │
│  {N} tickets total                              │
├─────────────────────────────────────────────────┤
│  Type: [All ▾]    Status: [All ▾]               │
├────┬──────┬──────────┬──────────┬────┬──────┬───┤
│    │ ID   │ Type     │ Message  │Page│Status│Age│
├────┼──────┼──────────┼──────────┼────┼──────┼───┤
│  ▸ │ #1   │ Bug      │ The ch...│ /  │ Open │2m │
│  ▾ │ #2   │ Question │ How do...│ /  │ Open │5m │
│    ├──────┴──────────┴──────────┴────┴──────┴───┤
│    │  [Expanded Detail Panel]                   │
│    │  Full message                              │
│    │  Metadata: tagged email, page, browser     │
│    │  Screenshot thumbnail → modal              │
│    │  Attachment download link                  │
│    │  Comments thread + input                   │
│    │  Status: [Open ▾] [Save]                   │
└────┴────────────────────────────────────────────┘
```

### States

- **Loading:** Spinner with "Loading tickets..."
- **Empty:** Inbox icon, "No support tickets yet. Use the chat widget in the bottom-right corner to submit one."
- **Error:** Red border/bg banner with error message
- **Populated:** Table with expandable rows

### Filters

- **Type:** `all` | `bug` | `improvement` | `question` | `other`
- **Status:** `all` | `open` | `in_progress` | `resolved` | `closed`
- Changing a filter triggers a re-fetch

### Table Columns

| Column | Width | Content |
|---|---|---|
| Expand toggle | `w-8` | ChevronRight / ChevronDown |
| ID | `w-16` | `#{id}` monospace |
| Type | `w-28` | Colored badge |
| Message | flex | Truncated to 80 chars |
| Page | `w-28` | Monospace page_url or "—" |
| Status | `w-28` | Colored badge |
| Created | `w-24` | Relative time |

### Badge Styles

**Type badges** (all variant="secondary"):
| Type | Classes |
|---|---|
| `bug` | `bg-red-100 text-red-700` |
| `improvement` | `bg-blue-100 text-blue-700` |
| `question` | `bg-amber-100 text-amber-700` |
| `other` | `bg-slate-100 text-slate-700` |

**Status badges:**
| Status | Variant | Classes |
|---|---|---|
| `open` | outline | `border-blue-300 text-blue-700` |
| `in_progress` | secondary | `bg-amber-100 text-amber-700` |
| `resolved` | secondary | `bg-green-100 text-green-700` |
| `closed` | secondary | `bg-slate-100 text-slate-600` |

### Expanded Detail Panel

- **Full message** — whitespace-pre-wrap
- **Metadata grid** (1–4 columns responsive): tagged_email, page_url, browser_info (truncated)
- **Screenshot** — h-20 w-32 thumbnail, hover overlay, click opens Dialog modal (max-h-[70vh])
- **Attachment** — Paperclip icon + "Download" link (target _blank)
- **Comments thread:**
  - Lists comments with text + relative timestamp
  - Input field + "Post" button
  - Enter key submits (Shift+Enter does not)
  - Empty state: "No comments yet" (italic)
- **Status changer:** Select dropdown (4 options) + Save button (disabled until changed)

### Relative Time Helper

```
< 60 seconds  → "just now"
< 60 minutes  → "{N}m ago"
< 24 hours    → "{N}h ago"
< 30 days     → "{N}d ago"
else           → "{N}mo ago"
```

---

## 12. Vite Dev Config

For local development, proxy API calls to the backend:

```typescript
// vite.config.ts
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8000",
      changeOrigin: true,
    },
  },
},
```

Run backend with: `uvicorn backend.api.main:app --reload --port 8000`
Run frontend with: `cd frontend && npm run dev`

---

## 13. Dockerfile (Single Container)

```dockerfile
# Stage 1: Build frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --ignore-scripts
COPY frontend/ ./
RUN npm run build

# Stage 2: Python runtime
FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
RUN useradd --create-home --shell /bin/bash appuser

WORKDIR /app
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./static/

RUN mkdir -p /data/uploads && chown -R appuser:appuser /data

ENV UPLOAD_DIR=/data/uploads
ENV DATABASE_URL=sqlite+aiosqlite:////data/support.db
ENV STATIC_DIR=/app/static

USER appuser
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["uvicorn", "backend.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 14. Northflank Deployment Checklist

| Setting | Value | Notes |
|---|---|---|
| **Service type** | Combined (not "Static Site") | Must run Dockerfile CMD |
| **Port** | 8000, HTTP, publicly exposed | |
| **Health check path** | `/api/health` | **Must include leading `/`** — without it, the URL is malformed |
| **Persistent volume** | Mount at `/data` | Stores SQLite DB + uploads. Without this, data is lost on every deploy. |
| **Environment variable** | `DEMO_PASSWORD=<your-password>` | Required — app crashes without it |

### Known Pitfalls

1. **Health check path:** Northflank concatenates port + path. If path is `api/health` instead of `/api/health`, the probe URL becomes `http://127.0.0.1:8000api/health` → parse error → readiness probe fails → no traffic routed.

2. **Trailing slashes:** Routes must use `""` not `"/"` for root-level paths when a catch-all `StaticFiles(html=True)` mount exists. See Section 6.

3. **Token persistence:** Auth tokens must be stored in the database, not in-memory dicts. Container restarts wipe memory. The SQLite DB on the persistent volume survives restarts.

4. **Mount order:** The React SPA catch-all (`app.mount("/", StaticFiles(html=True))`) must be the **last** mount. If it comes before API routes, it intercepts non-GET requests with 405.

---

## 15. File Inventory

### Backend

```
backend/
├── requirements.txt           # Python dependencies
└── api/
    ├── __init__.py
    ├── main.py                # FastAPI app, middleware, mount order
    ├── database.py            # Async SQLAlchemy engine + session factory
    ├── models.py              # ORM: AuthToken, SupportTicket, TicketComment
    ├── schemas.py             # Pydantic: enums, request/response models
    └── routes/
        ├── __init__.py
        ├── auth.py            # Login, token create/validate (DB-backed)
        └── support.py         # Ticket CRUD, file upload, comments
```

### Frontend

```
frontend/src/
├── lib/
│   ├── auth.ts                # Token CRUD, authHeaders, handleUnauthorized, forceLogout
│   ├── support-api.ts         # API client (6 functions, all use auth + 401 handling)
│   └── support-types.ts       # TypeScript interfaces and type aliases
├── components/layout/
│   └── SupportWidget.tsx      # Floating widget (menu → form → submitted)
├── pages/
│   ├── LoginPage.tsx          # Password form → POST /api/auth/login
│   └── Support/
│       └── SupportPage.tsx    # Ticket table + detail panels + comments
└── App.tsx                    # AuthContext, routing, token check on mount
```

---

## 16. Adapting for Another Project

### What to change

1. **`submitted_by`** — Currently hardcoded to `"mfolkerts@springfieldgrp.com"` in `SupportWidget.tsx`. Replace with the appropriate user email for your app, or derive from an auth context.

2. **Branding** — Widget header uses `bg-navy-700`. Submit button uses `bg-navy-700 hover:bg-navy-600`. Replace with your app's primary color.

3. **Login page** — Logo, title ("Demand Planning System"), and "powered by Annora" footer. Replace with your branding.

4. **Sidebar logout button** — Uses `useAuth()` from `App.tsx`. Wire the logout action into wherever your app's user menu or navigation lives.

5. **Route path** — The support page is at `/support`. Add to your app's router and navigation.

6. **`DEMO_PASSWORD`** — Set to whatever password you want for the demo.

### What NOT to change

- The API path prefix `/api/support` (hardcoded in both frontend and backend)
- The mount order in `main.py`
- The trailing-slash-free route definitions (`""` not `"/"`)
- The `data-support-widget` attribute on the widget wrapper (html2canvas depends on it)
- The sessionStorage key pattern (just keep it consistent between auth.ts and App.tsx)

