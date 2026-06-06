# BoviTrack — Demo Walkthrough (Screenshot Guide)

A 10-screen guided tour for stakeholder demos and screenshots. Follow the
order top to bottom — it mirrors the natural flow a livestock owner takes,
with **no dead ends** (every screen has the bottom nav on mobile / sidebar
on desktop, plus a back link on detail pages).

**Suggested device:** narrow mobile viewport (~390px) — BoviTrack is
mobile-first. Desktop shows the sidebar layout.

| # | Screen | Route |
| - | ------ | ----- |
| 1 | Dashboard | `/dashboard` |
| 2 | Alertes | `/alerts` |
| 3 | Fiche animal | `/herd/SN-BOV-2026-0002` |
| 4 | Localisation | `/location` |
| 5 | Santé | `/care` |
| 6 | Vaccins | `/vaccines` |
| 7 | Reproduction | `/breeding` |
| 8 | Naissances | `/births` |
| 9 | Ventes | `/sales` |
| 10 | Résultats | `/reports` |

---

### 1. Dashboard — `/dashboard`
- **Show:** greeting + 🔊 Écouter, the oversized red **Vol / Alerte** tile,
  the tappable summary cards, the action-tile grid (with badges), and the
  "À faire bientôt" + "Alertes vol" panels.
- **Key message:** "Open the app and you immediately know what needs
  attention — theft first."
- **Why it matters:** zero training; the highest risk (theft) is visually
  dominant.

### 2. Alertes — `/alerts`
- **Show:** the big « Signaler un vol » button, quick actions, and the list
  of active alerts with colour-coded statuses.
- **Key message:** "Report or track a stolen animal in one tap."
- **Why it matters:** theft is the client's most urgent, real-world pain.

### 3. Fiche animal — `/herd/SN-BOV-2026-0002` (Samba)
- **Show:** identity header, the **Security** panel at the top (red, with
  *Voir alerte*), then quick actions, identity, owner (call), location,
  health, reproduction, sales, and the history timeline.
- **Key message:** "Everything about one animal lives on a single card-based
  page."
- **Why it matters:** the animal is the core entity every module hangs off.

### 4. Localisation — `/location`
- **Show:** the map placeholder, the risk legend, and the position cards
  (zone normale / sorti de zone / position ancienne / alerte active). Alert
  cards link straight to the alert.
- **Key message:** "See where animals are and which ones left their zone."
- **Why it matters:** location + risk underpins anti-theft and herding.

### 5. Santé — `/care`
- **Show:** KPI cards, the **🚨 Urgent** filter, and care cards (urgent one
  stands out in red). Open one to show symptoms, treatment, follow-up, vet
  call.
- **Key message:** "Track treatments and call the vet without typing."
- **Why it matters:** animal health is daily, high-value work.

### 6. Vaccins — `/vaccines`
- **Show:** KPI cards (En retard in red), filter by type/zone, vaccine cards
  with due dates; open an overdue one (`VAC-2026-002`).
- **Key message:** "Never miss a vaccination — overdue ones are red."
- **Why it matters:** vaccination compliance protects the whole herd.

### 7. Reproduction — `/breeding`
- **Show:** KPI cards, status chips, breeding cards (Aïssata overdue in red);
  open Fanta (`REPRO-2026-001`) to show the gestation timeline + linked birth.
- **Key message:** "Plan calvings and follow each gestation."
- **Why it matters:** reproduction drives herd growth and income.

### 8. Naissances — `/births`
- **Show:** KPI cards, status filter, birth cards (mort-né stands out in
  red); open one to show calf identity, mother link, related breeding.
- **Key message:** "Record every calf and follow at-risk births."
- **Why it matters:** births are the productivity of the herd.

### 9. Ventes — `/sales`
- **Show:** KPI cards (**Montant total** in FCFA), status chips; open Khady
  (`VENTE-2026-001`) for the full ownership-transfer timeline and the two
  call buttons (vendeur + acheteur).
- **Key message:** "Sell and transfer ownership with a clear money trail."
- **Why it matters:** sales are the financial outcome — and traceability
  matters for trust.

### 10. Résultats — `/reports`
- **Show:** the 9 KPI cards, then the six summary sections and the
  zone/breed bars; tap 🔊 Écouter.
- **Key message:** "One screen tells the owner what to do today."
- **Why it matters:** managers get the whole herd at a glance — no analytics
  training.

---

## Talking points (whole demo)
- **Field-first UI:** big icons, big tap targets, very short labels, cards
  not tables — usable with limited literacy.
- **Anti-theft is the hero feature** and stays the most visible item.
- **Animal is the core entity:** health, vaccines, reproduction, births,
  sales and alerts all attach to it and cross-link.
- **Voice-ready:** 🔊 Écouter placeholders are everywhere, ready for Wolof /
  Pulaar / Français.
- **Senegalese identity:** green / gold / sand / earth palette, local
  breeds, zones, markets and FCFA.
- **Mock data only today** — Supabase/Postgres slot in behind this UI later
  (see `docs/product-principles.md`).
