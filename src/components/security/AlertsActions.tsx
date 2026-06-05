"use client";

import { useState } from "react";
import { QuickAction } from "@/components/common/QuickAction";

/**
 * Interactive header of the /alerts hub: the big "Signaler un vol" CTA
 * plus quick actions. Reporting flows (form, SMS/WhatsApp, voice) are
 * future work — for now placeholders surface a friendly hint so nothing
 * fails silently. "Voir dernière position" and "Appeler" are wired.
 */
export function AlertsActions({ responderTel }: { responderTel: string }) {
  const [hint, setHint] = useState<string | null>(null);

  function showHint(msg: string) {
    setHint(msg);
    window.setTimeout(() => setHint(null), 3000);
  }

  return (
    <section className="space-y-3">
      {/* Primary CTA */}
      <button
        type="button"
        onClick={() =>
          showHint("Bientôt : formulaire de signalement + alerte SMS / WhatsApp.")
        }
        className="tile-press flex w-full items-center justify-center gap-3 rounded-3xl bg-gradient-to-br from-alert to-alert-dark px-5 py-5 text-xl font-extrabold text-white shadow-tile-hover ring-2 ring-alert-light/40"
      >
        <span className="text-3xl" aria-hidden>
          🚨
        </span>
        Signaler un vol
      </button>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-3">
        <QuickAction
          icon="🐄"
          label="Animal manquant"
          tone="alert"
          onClick={() =>
            showHint("Bientôt : déclarer un animal manquant en quelques touches.")
          }
        />
        <QuickAction
          icon="📍"
          label="Dernière position"
          href="/location"
          tone="neutral"
        />
        <QuickAction
          icon="📞"
          label="Appeler"
          href={`tel:${responderTel.replace(/\s+/g, "")}`}
          tone="green"
        />
        <QuickAction
          icon="🔊"
          label="Écouter"
          tone="neutral"
          onClick={() =>
            showHint("🗣️ Assistance vocale bientôt — Wolof, Pulaar, Français.")
          }
        />
      </div>

      {hint && (
        <div
          role="status"
          className="rounded-2xl bg-earth px-4 py-3 text-sm font-medium text-white shadow-tile"
        >
          {hint}
        </div>
      )}
    </section>
  );
}
