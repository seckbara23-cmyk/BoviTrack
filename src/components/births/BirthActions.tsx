"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Quick actions for a birth detail page.
 * - Voir mère: links to the mother's profile when registered.
 * - Voir veau: links to the calf profile once it exists in the herd
 *   (Phase 4 calves are not yet registry entries → hint).
 * - Soins: links to the care module.
 * - Écouter: voice-first placeholder.
 */
export function BirthActions({
  motherId,
  motherRegistered,
  calfId,
  calfRegistered,
}: {
  motherId: string;
  motherRegistered: boolean;
  calfId?: string;
  calfRegistered: boolean;
}) {
  const [hint, setHint] = useState<string | null>(null);

  function showHint(msg: string) {
    setHint(msg);
    window.setTimeout(() => setHint(null), 3000);
  }

  const btn =
    "tile-press flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-center text-sm font-semibold shadow-card";

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {motherRegistered ? (
          <Link href={`/herd/${motherId}`} className={`${btn} bg-green text-white`}>
            <span className="text-2xl" aria-hidden>🐄</span>
            Voir mère
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => showHint("Cette mère n'a pas encore de fiche détaillée.")}
            className={`${btn} bg-green text-white`}
          >
            <span className="text-2xl" aria-hidden>🐄</span>
            Voir mère
          </button>
        )}

        {calfRegistered && calfId ? (
          <Link href={`/herd/${calfId}`} className={`${btn} bg-white text-earth`}>
            <span className="text-2xl" aria-hidden>🐮</span>
            Voir veau
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => showHint("Bientôt : enregistrer le veau dans le troupeau.")}
            className={`${btn} bg-white text-earth`}
          >
            <span className="text-2xl" aria-hidden>🐮</span>
            Voir veau
          </button>
        )}

        <Link href="/care" className={`${btn} bg-gold text-earth`}>
          <span className="text-2xl" aria-hidden>💉</span>
          Soins
        </Link>

        <button
          type="button"
          onClick={() => showHint("🗣️ Assistance vocale bientôt — Wolof, Pulaar, Français.")}
          className={`${btn} bg-white text-earth`}
        >
          <span className="text-2xl" aria-hidden>🔊</span>
          Écouter
        </button>
      </div>

      {hint && (
        <div role="status" className="rounded-2xl bg-earth px-4 py-3 text-sm font-medium text-white shadow-tile">
          {hint}
        </div>
      )}
    </section>
  );
}
