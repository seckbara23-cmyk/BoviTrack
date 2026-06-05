import type { AlertStatus } from "@/lib/mock-data";
import { alertStatusMeta } from "@/lib/mock-data";

/** Colour-coded pill for a theft-alert status. */
export function StatusBadge({
  status,
  size = "md",
}: {
  status: AlertStatus;
  size?: "sm" | "md";
}) {
  const meta = alertStatusMeta[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${meta.className} ${
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      }`}
    >
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}
