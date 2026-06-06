"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Quick actions for a breeding detail page.
 * - Appeler agent: real tel: link.
 * - Voir mère: links to the female's profile when she is registered.
 * - Enregistrer naissance: future flow → hint.
 * - Écouter: voice-first placeholder.
 */
export function BreedingActions({
  phone,
  femaleId,
  femaleRegistered,
}: {
  phone: string;
  femaleId: string;
  femaleRegistered: boolean;
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
        <a href={`tel:${phone.replace(/\s+/g, "")}`} className={`${btn} bg-green text-white`}>
          <span className="text-2xl" aria-hidden>📞</span>
          Appeler agent
        </a>

        {femaleRegistered ? (
          <Link href={`/herd/${femaleId}`} className={`${btn} bg-white text-earth`}>
            <span className="text-2xl" aria-hidden>🐄</span>
            Voir mère
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => showHint("Cette femelle n'a pas encore de fiche détaillée.")}
            className={`${btn} bg-white text-earth`}
          >
            <span className="text-2xl" aria-hidden>🐄</span>
            Voir mère
          </button>
        )}

        <button
          type="button"
          onClick={() => showHint("Bientôt : enregistrer la naissance liée à cette gestation.")}
          className={`${btn} bg-gold text-earth`}
        >
          <span className="text-2xl" aria-hidden>👶</span>
          Enregistrer naissance
        </button>

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
