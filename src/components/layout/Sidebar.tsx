"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav, secondaryNav } from "@/lib/navigation";
import { Logo } from "@/components/brand/Logo";

/** Desktop-only persistent navigation. Hidden below the lg breakpoint. */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sand-dark bg-white/60 px-4 py-6 lg:flex">
      <div className="px-2">
        <Logo />
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {primaryNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors ${
                active
                  ? "bg-green text-white shadow-tile"
                  : "text-earth hover:bg-green-50"
              }`}
            >
              <span className="text-xl" aria-hidden>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="my-3 border-t border-sand-dark" />

        {secondaryNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-green text-white"
                  : "text-earth/80 hover:bg-green-50"
              }`}
            >
              <span className="text-lg" aria-hidden>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        href="/herd/new"
        className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gold px-4 py-3 text-base font-semibold text-earth shadow-tile transition-colors hover:bg-gold-dark hover:text-white"
      >
        <span className="text-xl" aria-hidden>
          ➕
        </span>
        Ajouter un animal
      </Link>
    </aside>
  );
}
