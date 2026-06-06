"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Quick actions for a sale detail page.
 * - Appeler vendeur / acheteur: real tel: links.
 * - Voir animal: links to the animal profile when registered.
 * - Marquer transféré: future flow → hint.
 * - Écouter: voice-first placeholder.
 */
export function SaleActions({
  sellerPhone,
  buyerPhone,
  animalId,
  animalRegistered,
  isTransferred,
}: {
  sellerPhone: string;
  buyerPhone: string;
  animalId: string;
  animalRegistered: boolean;
  isTransferred: boolean;
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <a href={`tel:${sellerPhone.replace(/\s+/g, "")}`} className={`${btn} bg-green text-white`}>
          <span className="text-2xl" aria-hidden>📞</span>
          Appeler vendeur
        </a>

        <a href={`tel:${buyerPhone.replace(/\s+/g, "")}`} className={`${btn} bg-green text-white`}>
          <span className="text-2xl" aria-hidden>📞</span>
          Appeler acheteur
        </a>

        {animalRegistered ? (
          <Link href={`/herd/${animalId}`} className={`${btn} bg-white text-earth`}>
            <span className="text-2xl" aria-hidden>🐄</span>
            Voir animal
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => showHint("Cet animal n'a pas encore de fiche détaillée.")}
            className={`${btn} bg-white text-earth`}
          >
            <span className="text-2xl" aria-hidden>🐄</span>
            Voir animal
          </button>
        )}

        <button
          type="button"
          disabled={isTransferred}
          onClick={() => showHint("Bientôt : valider le transfert de propriété.")}
          className={`${btn} ${
            isTransferred ? "cursor-not-allowed bg-earth/10 text-earth/40" : "bg-gold text-earth"
          }`}
        >
          <span className="text-2xl" aria-hidden>✅</span>
          {isTransferred ? "Transféré" : "Marquer transféré"}
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
