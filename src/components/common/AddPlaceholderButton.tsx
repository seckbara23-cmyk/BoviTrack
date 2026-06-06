"use client";

import { useState } from "react";

/**
 * Large primary "add" CTA. The creation flow is future work, so for now
 * it surfaces a friendly hint instead of failing silently.
 */
export function AddPlaceholderButton({
  label,
  hint,
}: {
  label: string;
  hint: string;
}) {
  const [show, setShow] = useState(false);

  function handleClick() {
    setShow(true);
    window.setTimeout(() => setShow(false), 3000);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        className="tile-press flex w-full items-center justify-center gap-2 rounded-3xl bg-gradient-to-br from-green to-green-dark px-5 py-4 text-lg font-extrabold text-white shadow-tile-hover"
      >
        <span className="text-2xl" aria-hidden>
          ➕
        </span>
        {label}
      </button>

      {show && (
        <div
          role="status"
          className="rounded-2xl bg-earth px-4 py-3 text-sm font-medium text-white shadow-tile"
        >
          🛠️ {hint}
        </div>
      )}
    </div>
  );
}
