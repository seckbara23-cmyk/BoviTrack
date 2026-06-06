"use client";

import { useState } from "react";
import { QuickAction } from "@/components/common/QuickAction";

/**
 * Quick actions on the animal profile. Wired actions navigate to their
 * module; not-yet-built flows (Identification, Écouter) surface a hint.
 */
export function AnimalQuickActions({ alertId }: { alertId?: string }) {
  const [hint, setHint] = useState<string | null>(null);

  function showHint(msg: string) {
    setHint(msg);
    window.setTimeout(() => setHint(null), 3000);
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-earth">Actions rapides</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <QuickAction
          icon="🚨"
          label="Alerte"
          href={alertId ? `/alerts/${alertId}` : "/alerts"}
          tone="alert"
        />
        <QuickAction icon="📍" label="Position" href="/location" tone="neutral" />
        <QuickAction icon="💉" label="Soins" href="/care" tone="green" />
        <QuickAction
          icon="🏷"
          label="Identification"
          tone="neutral"
          onClick={() =>
            showHint("Bientôt : scan RFID / QR pour identifier l'animal.")
          }
        />
        <QuickAction icon="💰" label="Vente" href="/sales" tone="neutral" />
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
