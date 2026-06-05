"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ListenButton } from "@/components/common/ListenButton";

/**
 * Sticky top bar. On mobile it carries the brand + a quick "Écouter"
 * (voice-first placeholder). On desktop the brand lives in the Sidebar,
 * so we only keep the listen action and a profile pictogram.
 */
export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-sand-dark bg-sand/90 px-4 py-3 backdrop-blur lg:px-8">
      <div className="lg:hidden">
        <Logo compact />
      </div>

      <div className="hidden lg:block">
        <p className="text-sm font-medium text-earth/70">
          Suivi intelligent du cheptel
        </p>
      </div>

      <div className="flex items-center gap-2">
        <ListenButton compact />
        <Link
          href="/settings"
          aria-label="Profil et réglages"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-green text-lg text-white shadow-card"
        >
          🧑‍🌾
        </Link>
      </div>
    </header>
  );
}
