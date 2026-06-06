# BoviTrack — Offline-First Architecture & Product Split

> **Status: architecture planning only.** This document describes intent and
> direction. It does **not** rewrite the app, migrate screens, implement sync,
> change the Supabase schema, change the UI, or add dependencies. It builds on
> the existing prototype ([README](../README.md)), the
> [product principles](./product-principles.md) and the
> [database foundation](./database.md).

A clarified constraint reshapes the long-term architecture: **most herders — a
primary target audience — do not have reliable internet.** BoviTrack is
therefore designed as **two complementary layers** sharing one data model
(Animal as the core entity):

- **BoviTrack Field** — offline-first mobile experience for herders & field agents.
- **BoviTrack Management** — connected web/admin dashboard for owners,
  cooperatives, veterinarians, organizations, and future government stakeholders.

---

## 1. Why cloud-only is not enough for rural Senegal

The current prototype is a connected Next.js + Supabase web app. That is right
for *management*, but it cannot be the only layer, because:

- **Many herders have no internet.** Data coverage in grazing zones is partial,
  expensive, or absent. A cloud-only app is unusable exactly where the work happens.
- **Theft alerts cannot depend on cloud access.** Reporting a stolen or missing
  animal is the most time-critical action in the product. If it requires a
  signal, it fails when it matters most. The herder must be able to record the
  alert immediately, on-device, and have it propagate later.
- **Field work happens in remote grazing zones.** Births, treatments, vaccination
  rounds, and position notes are captured kilometres from any tower.
- **The app must keep working during transhumance.** Seasonal movement takes
  herds far from infrastructure for weeks. The product must travel with the herd,
  not stay behind at the farm.

**Conclusion:** the device must be the source of truth in the moment; the cloud
is an eventual, additive layer — never a prerequisite for field work.

---

## 2. Target users

| User | Layer | Primary needs |
| ---- | ----- | ------------- |
| **Herder** | Field | Offline-first, icon-first, voice-ready. Register/identify animals, report theft, note position & births in the field with no signal and minimal reading. |
| **Farm owner / cooperative** | Management | Connected dashboard, herd oversight, reports, alerts overview, administration of farms/animals/users. |
| **Veterinarian / field agent** | Both | Run health & vaccination campaigns; capture care/vaccine records offline in the field, review and plan from the dashboard. |
| **Government / organization** | Management | Traceability, aggregated insights across farms/cooperatives/regions; future regulatory reporting. |

Same animal identity, different surface and connectivity assumptions per user.

---

## 3. BoviTrack Field (offline-first)

The mobile layer the herder actually carries.

- **Android / mobile-first**, installable (PWA now, native wrapper later).
- **Local store on device** — IndexedDB (PWA) or SQLite (native) holds the
  herd's working data.
- **Works fully without internet** — every core flow completes offline.
- **Animal registry available offline** — browse/search the herd on-device.
- **Theft alert creation offline** — the highest priority: record a missing/
  stolen animal instantly; queue it for sync.
- **Local location history** — capture positions (manual now; GPS/LoRa later)
  stored locally with risk status.
- **Health / vaccine / birth / sale records created offline** — full capture in
  the field, queued for later sync.
- **Sync later when connection returns** — a background queue flushes to the
  cloud opportunistically (see §6).
- **Voice prompts in Wolof / Pulaar / Français** — spoken guidance and readback
  so the app is usable without reading.
- **Large icons & zero-reading workflows** — the existing « Zéro lecture
  obligatoire » UI is the baseline.

> The current prototype's mock-data screens are effectively a preview of the
> Field UI; they already assume on-device data and icon-first interaction.

---

## 4. BoviTrack Management (connected)

The web platform that already exists today.

- **Current Next.js / Supabase web platform.**
- **Connected dashboard** — live overview across the farm/cooperative.
- **Reports** — the existing Résultats module (KPIs, distributions).
- **Herd oversight** — registry, animal profiles, statuses.
- **Alerts dashboard** — theft/security alerts across the herd, with response status.
- **Health / vaccine campaigns** — plan and track care & vaccination rounds.
- **Sales / reproduction reporting** — financial and productivity insight.
- **Farm / cooperative administration** — manage farms, animals, owners, users,
  roles (multi-tenant RLS already in place — see [database.md](./database.md)).

Management consumes what Field produces (after sync) and what IoT devices report.

---

## 5. Future IoT layer

Optional hardware that strengthens identity, location, and connectivity — added
incrementally, never required for the base product:

- **RFID identification** — ear tag / bolus read by a handheld or gateway.
- **QR code identification** — printed code for low-cost visual ID.
- **GPS collar** — periodic position for high-value animals / theft zones.
- **LoRa communication** — long-range, low-power link from collars/tags to a gateway.
- **Raspberry Pi gateway** — low-cost edge hub at the camp/village.
- **Local WiFi hotspot** — phones sync to the gateway over local WiFi, no internet.
- **Offline gateway storage** — the gateway buffers device + phone data locally.
- **Later cloud sync** — the gateway flushes to Supabase when it gets a backhaul
  link (intermittent cellular, a trip to town, etc.).

---

## 6. Proposed architecture

```
Animal collar / RFID / GPS tag
        │  (identity + position)
        ▼
      LoRa  (long-range, low-power)
        │
        ▼
 Raspberry Pi gateway  ──►  local database (edge buffer)
        ▲                         │
        │  local WiFi hotspot     │
        ▼                         │
 BoviTrack Field (mobile)         │
   • on-device store              │
   • offline capture              │
   • sync queue                   │
        │                         │
        └──────────┬──────────────┘
                   ▼  (when any backhaul is available)
              Supabase (cloud)
                   │
                   ▼
        BoviTrack Management (web dashboard)
```

Key properties:
- **Two independent sync paths** — phone→cloud directly when it has signal, or
  phone→gateway→cloud when it doesn't. Field work never waits for either.
- **The edge buffer (gateway local DB) and the phone store are both durable** —
  data survives until a sync window opens.
- **Cloud is the convergence point**, not the gatekeeper.

---

## 7. Recommended phased roadmap

| Phase | Goal |
| ----- | ---- |
| **A — current** | Web prototype (mock data) + Supabase foundation (schema, RLS, seed). ✅ done. |
| **B** | Offline-first mobile / **PWA** design: installable, on-device store, offline-capable Field UI. |
| **C** | **Local sync queue**: durable outbox of offline changes with status (pending / synced / conflict). |
| **D** | **Supabase cloud sync**: flush the queue to Supabase; pull updates; last-write/merge rules. |
| **E** | **RFID / QR identification**: scan to identify and attach records to an animal. |
| **F** | **LoRa / GPS gateway prototype**: Raspberry Pi edge hub + collar/tag ingestion + local WiFi sync. |
| **G** | **Voice alerts in Wolof / Pulaar (+ Français)**: spoken prompts/readback for core flows. |
| **H** | **Cooperative / government dashboard**: cross-farm aggregation, traceability, regulatory reporting. |

Phases B–D make the product genuinely field-usable; E–F add hardware; G–H widen
reach. Each phase is shippable on its own.

---

## 8. Risks

| Risk | Note / mitigation direction |
| ---- | --------------------------- |
| **Hardware cost** | RFID/QR/collars/gateways add cost; keep QR as the low-cost floor and make hardware optional. |
| **Battery maintenance** | Collars/gateways need power in the field; favour low-power LoRa, solar for gateways, long duty cycles. |
| **Device loss** | Phones/tags get lost or stolen; data must be recoverable from cloud after sync; avoid device-only data. |
| **Offline sync conflicts** | Concurrent edits across phone/gateway/cloud; need clear conflict rules and an audit trail. |
| **Data duplication** | The same event captured on phone and gateway; use stable client-generated IDs + idempotent upserts. |
| **Training herders** | Low digital literacy; lean hard on icons + voice + zero-reading flows; in-person onboarding. |
| **Theft response process** | An alert is only useful if someone acts; define the human workflow (who is notified, how). |
| **False alerts** | Mistaken "missing" reports erode trust; allow quick "retrouvé"/cancel and confirmation steps. |
| **GPS accuracy** | Position drift in bush terrain; treat positions as approximate; combine with last-known zones. |
| **LoRa range limitations** | Range varies with terrain/obstacles; plan gateway placement; degrade gracefully to manual capture. |

---

## 9. Design principles to preserve

These are non-negotiable as the architecture evolves:

1. **A herder must be able to report an animal missing with zero internet.**
2. **Cloud sync must enhance the product, not block field work** — offline is the
   default path, not a fallback.
3. **Animal identity remains the core entity** — every layer (Field, gateway,
   Management) and every device attaches to the same animal.
4. **Every offline record must eventually sync to the animal timeline** — nothing
   captured in the field is lost; it converges on one history per animal.
5. **Voice and icons are not optional; they are core usability requirements** —
   not enhancements to add "later if there's time".

---

_See also: [product-principles.md](./product-principles.md),
[database.md](./database.md). This document is planning only — no implementation
is scheduled or performed here._
