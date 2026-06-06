# BoviTrack — Demo Scenarios

Five short, self-contained scenarios for client demonstrations. Every
scenario uses **mock data already present in the project** (no setup, no
backend). Each follows the « Zéro lecture obligatoire » principle: lead
with pictograms and colour, tap large cards, read little.

> Start each scenario from the **Dashboard** (`/` redirects to `/dashboard`).

---

## Scenario 1 — Alerte de vol 🚨

**Persona:** a herd owner notified that an animal is missing.

**Steps**
1. Dashboard → the red, pulsing **Vol / Alerte** tile is the loudest element.
2. Tap it → **/alerts** (anti-theft hub): big « Signaler un vol », quick
   actions, and the list of active alerts.
3. Open **Samba** (`VOL-2026-014`, *Recherche en cours*).
4. On the alert detail: see the last known position (Tambacounda — piste de
   Goudiry), the **owner & herder** with one-tap call, and the alert timeline.
5. Tap **🐄 Voir la fiche de l'animal** → the animal profile, where the
   red **Security** panel sits at the very top with **Voir alerte**.

**Key data:** Samba · `SN-BOV-2026-0002` · RFID-SN-784513 · Ousmane Sow /
Lamine Cissé.

**Message:** theft response is immediate, visual, and one tap from anywhere.

---

## Scenario 2 — Vaccination en retard 💉

**Persona:** a field agent doing the weekly vaccination round.

**Steps**
1. Dashboard → **Vaccins** tile (shows a badge of pending vaccinations).
2. **/vaccines** → KPI cards show **En retard** in red. Tap the **⏰ En
   retard** filter chip.
3. Open **Samba — Vaccin pasteurellose** (`VAC-2026-002`, *En retard*).
4. See planned date, the agent to call, batch field (to be filled), notes.
5. Tap **📞 Appeler agent** (one-tap call) — the action is obvious without
   reading instructions.

**Key data:** `VAC-2026-002` · pasteurellose · due 20 mai 2026 · Tambacounda
· Dr Cheikh Fall. (Compare with a done one: `VAC-2026-005`, batch
LOT-PPCB-2026-A14.)

**Message:** overdue health tasks surface in red and are actionable instantly.

---

## Scenario 3 — Vache gestante 🐄🐂

**Persona:** an owner tracking an expected calving.

**Steps**
1. Dashboard → **Reproduction** tile → **/breeding**.
2. KPI cards: **Gestations en cours**, **Mises bas prévues**. Note **Aïssata**
   stands out in red (« ⚠️ En retard » — mise bas proche).
3. Open **Fanta** (`REPRO-2026-001`, *Gestation*): father (Demba), method,
   expected birth **Août 2026**, follow-up note, timeline.
4. Tap **🐄 Voir mère** → Fanta's profile → the **Reproduction** panel shows
   the active gestation **and** her previous calf (Pathé).

**Key data:** Fanta · `SN-BOV-2026-0001` · gestation, mise bas Août 2026 ·
Dr Cheikh Fall.

**Message:** reproduction is tracked per animal, with the calving calendar
visible at a glance.

---

## Scenario 4 — Animal vendu 💰

**Persona:** an owner who sold a cow at the market and wants the transfer
recorded.

**Steps**
1. Dashboard → **Ventes** tile (badge = pending transfers) → **/sales**.
2. KPI cards: **Montant total** in FCFA, **Transferts en attente**.
3. Open **Khady** (`VENTE-2026-001`, *Transféré*): price **375 000 FCFA**,
   seller & buyer with one-tap call each, market (Linguère), and the full
   **ownership-transfer timeline** (enregistrée → prix → paiement →
   transférée → clôturée).
4. (Contrast) open `VENTE-2026-004` (paiement partiel) — payment issue shown
   in red; or `VENTE-2026-006` (annulé).
5. Tap **🐄 Voir animal** → Khady's profile → **Ventes & transfert** panel
   shows the completed sale.

**Key data:** Khady · `SN-BOV-2026-0005` · 375 000 FCFA · Cheikh Fall →
Fatou Diop · Marché de Linguère.

**Message:** sales and ownership transfers are traceable end to end, money
included.

---

## Scenario 5 — Vue d'ensemble (gestion) 📊

**Persona:** a manager / cooperative lead wanting the whole picture in 30s.

**Steps**
1. Dashboard → **Résultats** tile (badge = total items to review) →
   **/reports**.
2. Top: 9 big KPI cards (total animaux, sécurisés, alertes, soins urgents,
   vaccins en retard, gestations, naissances, ventes, **montant ventes**).
   Every card is tappable to its module.
3. Scroll the six sections — **Sécurité**, **Santé & Vaccins**,
   **Reproduction & Naissances**, **Ventes & Transferts**, **Troupeau par
   zone** (bars), **Troupeau par race** (bars).
4. Each section ends with clear actions (Voir alertes, Voir soins, …).
5. Tap **🔊 Écouter** (top right) to preview the future voice summary.

**Key data:** revenue **3 740 000 FCFA**, distribution Gobra 2 / others 1,
zones Linguère 2 / others.

**Message:** one screen tells the owner exactly what needs attention today,
no analytics training required.

---

## Reset between demos

There is no state to reset — all data is static mock data. Refresh the page
or return to `/dashboard` to start over.
