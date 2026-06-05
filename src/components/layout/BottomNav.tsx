"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { bottomNav } from "@/lib/navigation";

/**
 * Mobile bottom navigation with a raised central "Ajouter" action.
 * Hidden on desktop (lg+) where the Sidebar takes over.
 */
export function BottomNav() {
  const pathname = usePathname();

  // Split the four items around the central add button (2 + 2).
  const left = bottomNav.slice(0, 2);
  const right = bottomNav.slice(2);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-dark bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-2xl grid-cols-5 items-end px-2 pb-[env(safe-area-inset-bottom)] pt-1">
        {left.map((item) => (
          <NavTab key={item.href} item={item} active={pathname === item.href} />
        ))}

        {/* Central raised add button */}
        <div className="flex justify-center">
          <Link
            href="/herd/new"
            aria-label="Ajouter un animal"
            className="tile-press -mt-6 flex h-16 w-16 flex-col items-center justify-center rounded-full bg-gold text-earth shadow-tile-hover ring-4 ring-sand"
          >
            <span className="text-3xl leading-none" aria-hidden>
              ➕
            </span>
          </Link>
        </div>

        {right.map((item) => (
          <NavTab key={item.href} item={item} active={pathname === item.href} />
        ))}
      </div>
    </nav>
  );
}

function NavTab({
  item,
  active,
}: {
  item: { href: string; icon: string; shortLabel: string };
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition-colors ${
        active ? "text-green" : "text-earth/60"
      }`}
    >
      <span className="text-2xl leading-none" aria-hidden>
        {item.icon}
      </span>
      <span>{item.shortLabel}</span>
    </Link>
  );
}
