"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Action row for the alert detail page.
 * - Appeler: real tel: link to the owner.
 * - Voir carte: links to /location (mock map for now).
 * - Marquer retrouvé / Écouter: future flows — surface a hint for now.
 */
export function AlertDetailActions({
  ownerTel,
  isResolved,
}: {
  ownerTel: string;
  isResolved: boolean;
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
        <a
          href={`tel:${ownerTel.replace(/\s+/g, "")}`}
          className={`${btn} bg-green text-white`}
        >
          <span className="text-2xl" aria-hidden>
            📞
          </span>
          Appeler
        </a>

        <Link href="/location" className={`${btn} bg-white text-earth`}>
          <span className="text-2xl" aria-hidden>
            🗺️
          </span>
          Voir carte
        </Link>

        <button
          type="button"
          disabled={isResolved}
          onClick={() =>
            showHint("Bientôt : clôturer l'alerte et notifier les contacts.")
          }
          className={`${btn} ${
            isResolved
              ? "cursor-not-allowed bg-earth/10 text-earth/40"
              : "bg-gold text-earth"
          }`}
        >
          <span className="text-2xl" aria-hidden>
            ✅
          </span>
          {isResolved ? "Retrouvé" : "Marquer retrouvé"}
        </button>

        <button
          type="button"
          onClick={() =>
            showHint("🗣️ Assistance vocale bientôt — Wolof, Pulaar, Français.")
          }
          className={`${btn} bg-white text-earth`}
        >
          <span className="text-2xl" aria-hidden>
            🔊
          </span>
          Écouter
        </button>
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
