# AGENTS.md — SurveyForm Platform Guidance & Architecture Reference

This is the canonical guide for agents and developers working on **SurveyForm**. It documents the application architecture, code organization, UI replication protocol, Supabase database contracts, and deployment rules.

---

## 1. Project Overview & Scope

SurveyForm is an intelligent, universal survey platform that transforms questionnaire PDF documents (such as academic evaluations, Likert scales, ISO/IEC 25010 benchmarks, and UTAUT frameworks) into responsive online forms with shareable public links.

### Key Capabilities
- **Drag-and-Drop PDF Ingestion**: Client/server PDF extraction via `pdfjs-dist` that parses sections, directions, 5-point Likert matrices, stakeholder demographics, comments, and signatures.
- **Universal Field Tailoring**: Creators can toggle any field between **Required** and **Optional** (e.g., make Name optional for anonymous submissions) or apply a global **"Require All"** switch.
- **JSON Column Storage**: Flexible `schema jsonb` in the `surveys` table and `answers jsonb` in `survey_responses` to tailor any questionnaire format without table schema alterations.
- **Survey Management & Live Analytics**:
  - Live completion metrics, participation rates, and stakeholder role distributions.
  - Dimension and item mean scores with visual Recharts bar/pie charts.
  - **Editable Responses**: Managers can view, modify, or delete any submitted survey response.
  - **3-Way Data Export**: One-click export to CSV (Excel UTF-8 BOM), JSON, and formal PDF Evaluation Summary Reports.

---

## 2. Code Architecture & Separation (HITOVIS Protocol)

The project adheres to the **Feature-Sliced Design** conventions established in the HITOVIS ecosystem:

```text
src/
├── app/                                 # Thin Next.js App Router layer & API routes
│   ├── page.tsx                         # Landing / dashboard redirect
│   ├── layout.tsx                       # Root HTML shell with Efferd body tokens
│   ├── surveys/
│   │   ├── page.tsx                     # Survey management overview
│   │   ├── new/page.tsx                 # PDF Drag & Drop builder view
│   │   └── [id]/page.tsx                # Detail view: Analytics, Responses, Editor
│   ├── s/
│   │   └── [slug]/page.tsx              # Public respondent answering portal
│   ├── api/
│   │   ├── surveys/
│   │   │   ├── route.ts                 # List & Create survey endpoints
│   │   │   ├── [id]/route.ts            # Get, Update, Delete survey endpoints
│   │   │   ├── [id]/responses/route.ts  # Response collection & submission
│   │   │   └── parse-pdf/route.ts       # Server-side PDF parser
│   │   └── responses/
│   │       └── [id]/route.ts            # Edit individual submitted response
│   └── styles/
│       ├── globals.css                  # Active tokens, ambient lighting, OKLCH
│       ├── efferd-main.css              # Efferd compiled variant classes
│       └── efferd-chunk.css
│
├── features/                            # Domain-driven modules
│   ├── surveys/
│   │   ├── components/                  # SurveyList, SurveyUploadDropzone, SurveyFormBuilder, ShareModal
│   │   ├── hooks/                       # Survey data fetching & mutation hooks
│   │   ├── services/                    # surveyService, pdfParserService, exportService
│   │   └── types.ts                     # Domain contracts (Survey, Question, Section, LikertScale)
│   ├── responses/
│   │   └── components/                  # ResponsesTable, ResponseEditorModal
│   ├── analytics/
│   │   ├── components/                  # SurveyAnalyticsDashboard, DimensionScores
│   │   └── utils/                       # calculateSurveyMetrics, Likert math
│   └── public-form/
│       └── components/                  # PublicSurveyViewer, LikertScaleInput
│
├── components/
│   ├── ui/                              # Radix & Efferd primitives (button, card, decor-icon, dialog...)
│   └── common/                          # PageHeader, MetricCard, EmptyState, LoadingState, StatusChip
│
├── layout/
│   ├── components/Header.tsx            # Sticky navigation header
│   └── Layout.tsx                       # Application shell with ambient grid & glows
│
├── services/
│   └── supabase/                        # client.ts, server.ts, admin.ts
└── lib/
    └── utils.ts                         # cn helper, slug generator, date formatters
```

### Module Boundaries
- **`src/app/`**: Must remain a thin routing layer. Do not embed heavy business logic or state machines directly into `page.tsx` files. Delegate to feature controllers.
- **`src/features/<domain>/`**: Encapsulates all domain logic, components, services, and types.
- **`src/features/<domain>/types.ts`**: Canonical location for domain data contracts. Shared cross-domain types belong in `src/types/`.

---

## 3. UI Reference & Replication Guide (Efferd Components)

Source reference: `D:\wamp64\www\shodev\efferd_components`

### Rule 1: Scoped Theme Classes
Efferd compiles styles under scoped classes (such as `.style-nova .cn-button-variant-*`).
The `<body>` tag in `src/app/layout.tsx` **must** declare:
```html
<body class="overscroll-none bg-background font-sans text-foreground antialiased style-nova base-color-neutral">
```

### Rule 2: Authentic OKLCH Color Palette
Configured in `src/app/styles/globals.css`:
```css
:root, .dark {
  --background: oklch(0.145 0 0);      /* #09090b charcoal, enables radial lighting falloff */
  --foreground: oklch(0.985 0 0);      /* Crisp off-white */
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);          /* Primary button fill */
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);        /* Secondary button fill */
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --border: oklch(1 0 0 / 10%);         /* 10% subtle borders */
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --radius: 0.625rem;
}
```

### Rule 3: Typography Matching
- Font families default to **Geist** (`--font-sans`, `--font-heading`).
- All headings and metrics use `.font-heading`.

### Rule 4: Button Classes & Hover Fidelity
Buttons map directly to `.cn-button-variant-${variant}` and `data-slot="button"`. Avoid overriding Tailwind utility colors directly in `button.tsx` so Efferd's fine-tuned `color-mix` CSS hover rules take effect:
- **Default Hover**: `color-mix(in oklab, var(--primary) 80%, transparent)`
- **Secondary Hover**: `color-mix(in oklch, var(--secondary), var(--foreground) 5%)`

### Rule 5: Corner Crosshairs & Ambient Grids
- Use `<DecorIcon position="top-right" />` on cards and dropzones.
- Background uses `.efferd-grid` (40px subtler grid) and `.efferd-glow` (radial ambient glow).

---

## 4. Supabase Integration & Database Contracts

### API Keys
Supabase has transitioned to **Publishable Keys** (`sb_publishable_...`) and **Secret Keys** (`sb_secret_...`):
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Safe for frontend browser execution with RLS enabled.
- `SUPABASE_SECRET_KEY`: Server-side privileged access only. Never prefix with `NEXT_PUBLIC_`.

### Database Schema (`supabase/schema.sql`)
1. **`surveys` table**:
   - `id uuid primary key default gen_random_uuid()`
   - `slug text unique not null`
   - `title text not null`
   - `description text`
   - `instructions text`
   - `schema jsonb not null default '{}'::jsonb`
   - `status text not null default 'published'`
   - `created_at timestamptz default now()`
   - `updated_at timestamptz default now()`
2. **`survey_responses` table**:
   - `id uuid primary key default gen_random_uuid()`
   - `survey_id uuid references surveys(id) on delete cascade`
   - `respondent_name text`
   - `respondent_role text`
   - `answers jsonb not null default '{}'::jsonb`
   - `completion_status text not null default 'completed'`
   - `created_at timestamptz default now()`
   - `updated_at timestamptz default now()`

### RLS Policies
- `surveys`: Public can SELECT published rows (`status = 'published'`); authenticated/service role can INSERT, UPDATE, DELETE.
- `survey_responses`: Public can INSERT responses; managers can SELECT, UPDATE, DELETE.

---

## 5. Vercel Deployment & URL Configuration Guide

When deploying to Vercel:

### 1. Vercel Environment Variables
In your Vercel project settings (**Settings > Environment Variables**), set the following keys for `Production`, `Preview`, and `Development`:

| Variable Name | Environment | Value Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | All | `https://igglzaqyixhpsfbwpryg.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | All | `sb_publishable_M0LqSilTGDbBDAF6wISIsA_28_Wc8c9` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | `sb_publishable_M0LqSilTGDbBDAF6wISIsA_28_Wc8c9` (compatibility) |
| `SUPABASE_SECRET_KEY` | All | `sb_secret_...` (from your Supabase API settings) |
| `SUPABASE_SERVICE_ROLE_KEY` | All | `sb_secret_...` (compatibility fallback) |
| `NEXT_PUBLIC_APP_URL` | Production | `https://your-domain.vercel.app` |

### 2. Supabase Dashboard URL Configuration
Navigate to your Supabase Dashboard:
**Project Settings > Authentication > URL Configuration**

1. **Site URL**:
   Set to your production domain:
   ```text
   https://your-domain.vercel.app
   ```
2. **Redirect URLs**:
   Add wildcard redirect URLs for local development and Vercel branch previews:
   ```text
   http://localhost:3000/**
   https://*-your-username.vercel.app/**
   https://your-domain.vercel.app/**
   ```

---

## 6. Verification Protocol

Before declaring completion of any changes:
1. `npx tsc --noEmit` must pass with **0 errors**.
2. `npm run build` must succeed with **0 errors**.
3. Responsive check: verify on mobile viewports (375px+), tablet, and desktop.
4. Data validation: ensure JSON schemas remain backwards-compatible.

---

## 7. PWA & Mobile Home Screen Installation

SurveyForm is a full Progressive Web App (PWA) installable directly to the home screen of Android, iOS, tablet, and desktop devices:

- **Manifest**: `public/manifest.json` configured with standalone mode, orientation support, shortcuts, and brutalist color scheme (`#090e14` background, `#10b981` theme color).
- **Service Worker**: `public/sw.js` provides precaching of core assets, offline shell fallback (`public/offline.html`), and background cache updates.
- **Brand Logo & Icons**:
  - `public/icons/logo.svg`: High-resolution vector geometric emblem featuring 90° razor-sharp box corners, evaluation bars, and cybernetic emerald checkmark.
  - `public/icons/icon-192x192.png`: Android home screen & task switcher icon.
  - `public/icons/icon-512x512.png`: High-DPI launch splash icon.
  - `public/icons/icon-512x512-maskable.png`: Maskable icon with safe-zone padding.
  - `public/icons/apple-touch-icon.png`: iOS home screen icon (180x180).
  - `public/favicon.ico`, `favicon-32x32.png`, `favicon-16x16.png`: Browser tabs & bookmarks.
- **Install Prompt UI**: `src/components/common/PwaInstallPrompt.tsx` captures `beforeinstallprompt` on Android/Chrome/Edge, provides a floating install trigger, and gives a 3-step guide for iOS Safari users.


