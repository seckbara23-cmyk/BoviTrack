/** Small labelled field (label + value) used inside detail panels. */
export function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-sand p-3 leading-tight">
      <dt className="text-xs font-semibold text-earth/50">{label}</dt>
      <dd className="mt-0.5 font-semibold text-earth">{value}</dd>
    </div>
  );
}
