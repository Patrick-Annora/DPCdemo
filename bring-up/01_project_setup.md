# Spec 01 — Project Setup: Vite + React 19 + TypeScript Strict + Tailwind CSS 4

> **Module:** Bring-Up
> **Status:** Draft
> **Kernel Refs:** SS2.1 (Stack), SS2.2 (Project Structure), SS9 (Environment Variables)
> **Depends on:** Nothing (this is the first spec)

---

## 1. Overview

Bootstrap the `frontend/` directory as a Vite 6 + React 19 + TypeScript 5.9 project with Tailwind CSS 4, strict linting, and a test harness. On completion the project compiles, lints, type-checks, and runs an empty dev server with zero errors.

This is a **frontend-only** scaffold. No backend, no Python, no database.

---

## 2. Project Initialization

```bash
# From the repo root (SpringfieldMarine/)
npm create vite@latest frontend -- --template react-ts
cd frontend
```

After scaffolding, replace/update the generated files as specified in the sections below.

---

## 3. Directory Structure

Create the full directory tree from Kernel SS2.2. Every directory must exist (use `.gitkeep` files in empty directories so Git tracks them).

```
frontend/
  src/
    pages/
      ActionCenter/
      Alerts/
      SkuDetail/
      Forecast/
      InventoryParameters/
      Dashboard/
      Pipeline/
      BomExplorer/
      ReshoringTracker/
    components/
      layout/
      worklist/
      alerts/
      charts/
      sku/
      inventory/
      bom/
      common/
    data/
    lib/
    hooks/
```

Each leaf directory gets a `.gitkeep` file. The Vite scaffold's default `src/App.tsx`, `src/App.css`, `src/index.css`, and `src/main.tsx` are retained but will be overwritten per sections below.

---

## 4. Dependencies

### 4.1 Production Dependencies

Install via `npm install`:

| Package | Version Constraint | Purpose |
|---------|--------------------|---------|
| `react` | `^19.0.0` | UI library |
| `react-dom` | `^19.0.0` | DOM renderer |
| `react-router` | `^7.0.0` | Routing (v7 unified package) |
| `recharts` | `^2.15.0` | Charts |
| `@tanstack/react-table` | `^8.21.0` | Headless tables |
| `@tanstack/react-query` | `^5.65.0` | Async state / mock API layer |
| `lucide-react` | `^0.475.0` | Icons |

### 4.2 Dev Dependencies

Install via `npm install -D`:

| Package | Version Constraint | Purpose |
|---------|--------------------|---------|
| `typescript` | `^5.9.0` | Type system |
| `@types/react` | `^19.0.0` | React type defs |
| `@types/react-dom` | `^19.0.0` | ReactDOM type defs |
| `vite` | `^6.0.0` | Build tool |
| `@vitejs/plugin-react` | `^4.4.0` | Vite React plugin |
| `tailwindcss` | `^4.0.0` | Utility-first CSS |
| `@tailwindcss/vite` | `^4.0.0` | Tailwind Vite plugin |
| `eslint` | `^9.0.0` | Linter |
| `@eslint/js` | `^9.0.0` | ESLint core rules |
| `typescript-eslint` | `^8.0.0` | TS ESLint integration |
| `eslint-plugin-react-hooks` | `^5.0.0` | React Hooks lint rules |
| `eslint-plugin-react-refresh` | `^0.4.0` | React Refresh lint rules |
| `globals` | `^15.0.0` | Global variable definitions for ESLint |
| `vitest` | `^3.0.0` | Test runner |
| `jsdom` | `^26.0.0` | DOM environment for tests |
| `@testing-library/react` | `^16.0.0` | React test utilities |
| `@testing-library/jest-dom` | `^6.0.0` | DOM assertion matchers |

---

## 5. Configuration Files

### 5.1 `tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

Also create `tsconfig.app.json` and `tsconfig.node.json` as Vite expects (the scaffold generates these; keep them consistent with the strict settings above).

### 5.2 `vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### 5.3 Tailwind CSS 4 Setup

Tailwind v4 uses CSS-first configuration. No `tailwind.config.js` file.

**`src/index.css`:**

The full `@theme` definition is specified in **Spec 02 §4.1**. The starter file here establishes the brand color foundation — the complete token set (semantic colors, surfaces, shadows, spacing) is added in Spec 02.

```css
@import "tailwindcss";

@theme {
  /* ── Brand: Springfield Navy (from logo + website) ── */
  --color-navy-50:  #f0f7fc;
  --color-navy-100: #dcedf8;
  --color-navy-200: #b8daf1;
  --color-navy-300: #84bfe6;
  --color-navy-400: #4a9dd6;
  --color-navy-500: #2a7db8;
  --color-navy-600: #0b4874;
  --color-navy-700: #084974;
  --color-navy-800: #063d62;
  --color-navy-900: #025482;
  --color-navy-950: #021e30;

  /* ── Brand: Springfield Gold (from website) ── */
  --color-gold-50:  #fffbeb;
  --color-gold-100: #fff3c4;
  --color-gold-200: #ffe588;
  --color-gold-300: #ffd54f;
  --color-gold-400: #ffc10a;
  --color-gold-500: #e6a800;
  --color-gold-600: #cc9200;
  --color-gold-700: #a37300;
  --color-gold-800: #7a5600;
  --color-gold-900: #523a00;

  /* ── Brand: Springfield Red (from logo flag) ── */
  --color-springfield-red: #ea2829;

  /* ── Semantic: Status & KPI ── */
  --color-success-50:  #ecfdf5;
  --color-success-100: #d1fae5;
  --color-success-500: #10b981;
  --color-success-700: #047857;

  --color-warning-50:  #fffbeb;
  --color-warning-100: #fef3c7;
  --color-warning-500: #f59e0b;
  --color-warning-700: #b45309;

  --color-danger-50:  #fef2f2;
  --color-danger-100: #fee2e2;
  --color-danger-500: #ef4444;
  --color-danger-700: #b91c1c;

  --color-info-50:  #eff6ff;
  --color-info-100: #dbeafe;
  --color-info-500: #3b82f6;
  --color-info-700: #1d4ed8;

  /* ── Surface & Background ── */
  --color-surface-primary:   #ffffff;
  --color-surface-secondary: #f8fafc;
  --color-surface-tertiary:  #f1f5f9;
  --color-surface-sidebar:   #025482;
  --color-surface-topbar:    #ffffff;

  /* ── Typography ── */
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, 'Cascadia Code', monospace;

  /* ── Border Radius ── */
  --radius-card: 0.5rem;
  --radius-badge: 9999px;
  --radius-button: 0.375rem;

  /* ── Shadows ── */
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-card-hover: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}
```

### 5.4 `eslint.config.js`

Flat config format (ESLint 9+):

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  }
);
```

### 5.5 Vitest Configuration

**`vitest.config.ts`:**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
});
```

**`src/test/setup.ts`:**

```ts
import "@testing-library/jest-dom/vitest";
```

---

## 6. package.json Scripts

```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "preview": "vite preview"
  }
}
```

---

## 7. Starter Files

### 7.1 `src/main.tsx`

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### 7.2 `src/App.tsx`

Minimal placeholder that proves the scaffold works:

```tsx
function App() {
  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          Springfield Marine — Demand Planning
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Project scaffold ready. All systems nominal.
        </p>
      </div>
    </div>
  );
}

export default App;
```

### 7.3 `src/vite-env.d.ts`

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_DEMO_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## 8. Environment Variables

### 8.1 `.env.example`

Per Kernel SS9:

```env
# App title displayed in browser tab and top bar
VITE_APP_TITLE=Springfield Marine — Demand Planning

# API base URL — leave empty to use mock data layer
VITE_API_BASE_URL=

# Demo mode — when "true", all data comes from mock layer (no backend required)
VITE_DEMO_MODE=true
```

### 8.2 `.env`

Copy `.env.example` to `.env` for local development. The `.env` file is gitignored.

---

## 9. `.gitignore`

```gitignore
# Dependencies
node_modules/

# Build output
dist/

# Environment
.env
.env.local
.env.*.local

# Editor
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Test coverage
coverage/

# Vite
*.local

# TypeScript
*.tsbuildinfo
```

---

## 10. `index.html`

Vite's entry HTML (at `frontend/index.html`, not in `src/`):

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Springfield Marine — Demand Planning</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 11. Smoke Test

Create a minimal test to verify the harness works.

**`src/test/smoke.test.tsx`:**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "../App";

describe("Smoke test", () => {
  it("renders the scaffold heading", () => {
    render(<App />);
    expect(
      screen.getByText("Springfield Marine — Demand Planning")
    ).toBeInTheDocument();
  });
});
```

---

## 12. Acceptance Criteria

All criteria must pass before this spec is considered complete.

| # | Criterion | Verification Command |
|---|-----------|---------------------|
| 1 | `npm install` completes with zero errors | `cd frontend && npm install` |
| 2 | `npm run dev` starts Vite dev server without errors | `npm run dev` (manual — confirm localhost loads) |
| 3 | `npm run type-check` passes with zero errors | `npm run type-check` |
| 4 | `npm run lint` passes with zero errors | `npm run lint` |
| 5 | `npm run build` produces `dist/` with zero errors | `npm run build` |
| 6 | `npm run test` passes the smoke test | `npm run test` |
| 7 | Tailwind CSS classes render correctly | Dev server shows styled heading on gray background |
| 8 | Path alias `@/*` resolves | Import `@/App` works in any file under `src/` |
| 9 | All Kernel SS2.2 directories exist | `find src/pages src/components src/data src/lib src/hooks -type d` shows full tree |
| 10 | `.env.example` contains all three Kernel SS9 variables | File exists with `VITE_APP_TITLE`, `VITE_API_BASE_URL`, `VITE_DEMO_MODE` |
| 11 | No production dependencies on backend packages | `package.json` contains zero Python/Node server/DB packages |

---

## 13. Implementation Notes

- **Do not eject Vite.** All configuration goes through `vite.config.ts`.
- **Tailwind v4 has no `tailwind.config.js`.** All theming is done via `@theme` directives in CSS. Do not create a JS/TS config file.
- **React Router is not wired up in this spec.** Routing setup is deferred to a later spec. The `App.tsx` here is a static placeholder.
- **TanStack Query provider is not wired up in this spec.** The `QueryClientProvider` wrapper is deferred to a later spec.
- **Version constraints are minimums.** Use the latest patch within the specified major.minor range at install time.
- **The `frontend/` directory is the npm project root.** All `npm` commands run from `frontend/`.
