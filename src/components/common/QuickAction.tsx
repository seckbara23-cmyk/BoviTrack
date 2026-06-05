"use client";

import Link from "next/link";

/**
 * Square, icon-led quick action used on the alerts hub.
 * Renders as a link when `href` is given, otherwise as a button.
 */
export function QuickAction({
  icon,
  label,
  href,
  onClick,
  tone = "neutral",
}: {
  icon: string;
  label: string;
  href?: string;
  onClick?: () => void;
  tone?: "neutral" | "alert" | "green";
}) {
  const toneClass = {
    neutral: "bg-white text-earth",
    alert: "bg-alert/10 text-alert",
    green: "bg-green-50 text-green",
  }[tone];

  const inner = (
    <>
      <span className="text-3xl leading-none" aria-hidden>
        {icon}
      </span>
      <span className="text-xs font-semibold leading-tight">{label}</span>
    </>
  );

  const className = `tile-press flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl p-2 text-center shadow-card hover:shadow-tile ${toneClass}`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}
