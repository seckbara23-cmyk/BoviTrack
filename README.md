# BoviTrack 🐄

**Suivi intelligent du cheptel** — cattle records, herd management, and livestock traceability for Senegal.

Phase 1 is a UI/UX foundation: application shell, navigation, dashboard, and a mobile-first experience. **No database, no auth, no backend — mock data only.**

## Core principle — « Zéro lecture obligatoire »

Many users will have limited literacy or digital experience. The interface is built around **large icons, large touch targets, very short labels, and visual-first actions** — it should feel like a field app, not an office ERP. The UI is also pre-shaped for future **voice assistance** (Wolof, Pulaar, Français) via the `🔊 Écouter` button.

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Deploys on Vercel
- Supabase / PostgreSQL — _later phases_

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000  → redirects to /dashboard
npm run build    # production build
```

## Routes

| Route | Status |
| --- | --- |
| `/` | Redirects to `/dashboard` |
| `/dashboard` | Action tiles, summary cards, alerts, tasks |
| `/herd`, `/herd/new` | Animal list (mock) + add placeholder |
| `/alerts` | Active alerts (mock) |
| `/care`, `/vaccines`, `/breeding`, `/births`, `/location`, `/sales`, `/reports`, `/users`, `/settings` | Clean empty-state placeholders |

## Design tokens

| Token | Value |
| --- | --- |
| Primary Green | `#0F7B45` |
| Gold Accent | `#D4A017` |
| Alert Red | `#C0392B` |
| Sand Background | `#F7F3E8` |
| Earth Brown | `#6B4F3A` |

## Project structure

```
src/
  app/                 # App Router pages (one folder per route)
  components/
    brand/             # Logo
    common/            # ListenButton, EmptyState
    dashboard/         # ActionTile, SummaryCard
    herd/              # AnimalCard
    layout/            # AppShell, Sidebar, BottomNav, TopBar
  lib/
    navigation.ts      # Shared nav config (sidebar + bottom bar)
    mock-data.ts       # Senegal-context mock data
```
