/** Generic colour-coded status pill driven by metadata from mock-data. */
export function Badge({
  emoji,
  label,
  className,
  size = "md",
}: {
  emoji: string;
  label: string;
  className: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${className} ${
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      }`}
    >
      <span aria-hidden>{emoji}</span>
      {label}
    </span>
  );
}
