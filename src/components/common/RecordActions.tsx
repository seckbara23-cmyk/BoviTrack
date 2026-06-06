"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Shared quick-action row for care & vaccine detail pages.
 * - Call: real tel: link to the responsible vet/agent.
 * - Voir animal: links to the animal profile.
 * - "Marquer …": future flow — surfaces a hint.
 * - Écouter: voice-first placeholder.
 */
export function RecordActions({
  phone,
  callLabel,
  animalId,
  doneLabel,
  doneHint,
  isDone,
}: {
  phone: string;
  callLabel: string;
  animalId: string;
  doneLabel: string;
  doneHint: string;
  isDone: boolean;
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
          <span className="text-2xl" aria-hidden>
            📞
          </span>
          {callLabel}
        </a>

        <Link href={`/herd/${animalId}`} className={`${btn} bg-white text-earth`}>
          <span className="text-2xl" aria-hidden>
            🐄
          </span>
          Voir animal
        </Link>

        <button
          type="button"
          disabled={isDone}
          onClick={() => showHint(doneHint)}
          className={`${btn} ${
            isDone
              ? "cursor-not-allowed bg-earth/10 text-earth/40"
              : "bg-gold text-earth"
          }`}
        >
          <span className="text-2xl" aria-hidden>
            ✅
          </span>
          {doneLabel}
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
