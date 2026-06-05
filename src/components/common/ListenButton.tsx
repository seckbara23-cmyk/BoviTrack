"use client";

import { useState } from "react";

/**
 * Voice-first placeholder. Audio is NOT implemented yet — this button
 * exists so the UI is already shaped for future spoken assistance in
 * Wolof, Pulaar and Français. Tapping it shows a friendly "coming soon"
 * hint rather than doing nothing silently.
 */
export function ListenButton({ compact = false }: { compact?: boolean }) {
  const [hint, setHint] = useState(false);

  function handleClick() {
    setHint(true);
    window.setTimeout(() => setHint(false), 2600);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        aria-label="Écouter (assistance vocale à venir)"
        className={
          compact
            ? "flex h-11 items-center gap-1.5 rounded-full bg-green/10 px-3 text-sm font-semibold text-green transition-colors hover:bg-green/20"
            : "tile-press flex items-center gap-2 rounded-2xl bg-green px-5 py-3 text-base font-semibold text-white shadow-tile hover:bg-green-dark"
        }
      >
        <span className="text-xl" aria-hidden>
          🔊
        </span>
        <span>Écouter</span>
      </button>

      {hint && (
        <div
          role="status"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl bg-earth px-3 py-2 text-xs font-medium text-white shadow-tile-hover"
        >
          🗣️ Assistance vocale bientôt disponible — Wolof, Pulaar, Français.
        </div>
      )}
    </div>
  );
}
