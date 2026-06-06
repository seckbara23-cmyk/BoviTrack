# BoviTrack — Product Principles

These principles guide every product and design decision for BoviTrack
(**« Suivi intelligent du cheptel »**). They are the "why" behind the UI: a
field tool for cattle records, herd tracking, and livestock security in Senegal.

When a decision is unclear, favour the principle that keeps the app usable for a
herder in the field with low literacy, an old phone, and a weak network.

---

## 1. Zéro lecture obligatoire (Zero required reading)

The app must be usable with minimal reading. Meaning is carried by large icons,
pictograms, colour, and very short labels — text is a secondary aid, never a
prerequisite. Any user (owner, breeder, herder, field agent, veterinarian),
including those with limited literacy, should understand the core flows by sight
alone.

## 2. Offline-first

Connectivity in pastoral zones is intermittent. The app should function without a
live connection: data is available, actions can be taken, and changes sync when
the network returns. Loss of signal must never block a critical action such as
reporting a stolen animal.

## 3. Mobile-first

The phone in the field is the primary device. Layouts, navigation, and
interactions are designed for small screens and one-handed use first; desktop is
a secondary, enhanced experience.

## 4. Voice-ready

The interface is shaped so spoken assistance can be added later without redesign.
Voice entry points (e.g. « Écouter ») are present in the UI today as placeholders,
so reading and typing will not be the only ways to use the app.

## 5. Wolof-ready

The product is built to support Wolof as a first-class language. Content and UI
structure anticipate Wolof labels and, in time, Wolof voice — not only French.

## 6. Pulaar-ready

The product is equally built to support Pulaar, reflecting the language of many
pastoralist communities. UI and future voice support should accommodate Pulaar
alongside Wolof and French.

## 7. Anti-theft first

Theft prevention is an urgent, high-priority feature in Senegal and stays highly
visible across the app. Reporting a stolen or missing animal, seeing its last
known location, identifying it by tag, and contacting the responsible person must
be fast and obvious — the anti-theft path is never buried.

## 8. Large touch targets

Buttons, tiles, and controls are large and well-spaced for use with gloves, in
sunlight, in motion, and on lower-quality screens. Tapping the right thing should
require no precision.

## 9. Icon-first navigation

Navigation is driven by recognisable icons and pictograms, not text-heavy menus
or ERP-style structures. Users navigate by image; labels reinforce rather than
define.

## 10. Senegal livestock context

The product reflects local reality: Senegalese breeds (Gobra, Ndama, Djakoré,
Montbéliarde), regions (Thiès, Kaolack, Linguère, Matam, Dahra, Tambacounda),
naming, transhumance patterns, and pastoral workflows. It should feel
agricultural, pastoral, trustworthy, and Senegalese — not like a generic SaaS,
banking, or government portal.

## 11. Future LoRa and RFID integration

The architecture anticipates long-range (LoRa) connectivity and RFID animal
identification. UI surfaces (tags, identifiers, location) are designed so these
integrations can plug in later without reworking the product.

## 12. Future Raspberry Pi gateway integration

The system anticipates low-cost edge gateways (e.g. Raspberry Pi) acting as local
hubs — for example bridging LoRa/RFID devices to the cloud and enabling
offline-first sync in the field. Data and sync models should leave room for such
a gateway.

---

_These are principles, not a backlog. This document describes intent and
constraints only; it does not implement or schedule any feature._
