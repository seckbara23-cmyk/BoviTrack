import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/common/Badge";
import { ContactButton } from "@/components/security/ContactButton";
import { RecordActions } from "@/components/common/RecordActions";
import {
  getVaccineById,
  getAnimalById,
  vaccineRecords,
  vaccineStatusMeta,
} from "@/lib/mock-data";

export function generateStaticParams() {
  return vaccineRecords.map((v) => ({ vaccineId: v.id }));
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-sand p-3 leading-tight">
      <dt className="text-xs font-semibold text-earth/50">{label}</dt>
      <dd className="mt-0.5 font-semibold text-earth">{value}</dd>
    </div>
  );
}

function Panel({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-card">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-earth">
        <span aria-hidden>{icon}</span> {title}
      </h2>
      {children}
    </section>
  );
}

export default async function VaccineDetailPage({
  params,
}: {
  params: Promise<{ vaccineId: string }>;
}) {
  const { vaccineId } = await params;
  const vaccine = getVaccineById(vaccineId);

  if (!vaccine) {
    notFound();
  }

  const animal = getAnimalById(vaccine.animalId);
  const status = vaccineStatusMeta[vaccine.status];
  const isDone = vaccine.status === "fait";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/vaccines" className="flex items-center gap-1.5 text-sm font-semibold text-earth/70">
          <span aria-hidden>‹</span> Vaccins
        </Link>
        <span className="font-mono text-xs text-earth/40">{vaccine.id}</span>
      </div>

      {/* Animal identity card → link to profile */}
      <Link
        href={`/herd/${vaccine.animalId}`}
        className="tile-press flex items-center gap-4 rounded-3xl bg-white p-4 shadow-card hover:shadow-tile"
      >
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sand text-4xl" aria-hidden>
          {animal ? animal.emoji : "🐄"}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <h1 className="truncate text-lg font-extrabold text-earth">
            {animal ? animal.name : vaccine.animalId}
          </h1>
          <p className="font-mono text-xs text-earth/50">{vaccine.animalId}</p>
          {animal && (
            <p className="text-xs text-earth/60">
              🧬 {animal.identity.breed} · 📍 {animal.ownership.location}
            </p>
          )}
        </div>
        <span className="text-sm font-semibold text-green">Voir 🐄 ›</span>
      </Link>

      {/* Vaccine header */}
      <section className="rounded-3xl bg-white p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden>
            {vaccine.icon}
          </span>
          <div className="leading-tight">
            <p className="text-xs font-semibold uppercase tracking-wide text-earth/50">
              Vaccin
            </p>
            <h2 className="text-xl font-extrabold text-earth">{vaccine.name}</h2>
          </div>
        </div>
        <div className="mt-3">
          <Badge {...status} />
        </div>
      </section>

      {/* Actions */}
      <RecordActions
        phone={vaccine.agent.phone}
        callLabel="Appeler agent"
        animalId={vaccine.animalId}
        doneLabel={isDone ? "Fait" : "Marquer fait"}
        doneHint="Bientôt : enregistrer la vaccination (date, lot, agent)."
        isDone={isDone}
      />

      {/* Dates & details */}
      <Panel icon="📅" title="Détails de la vaccination">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Date prévue" value={vaccine.dueDate} />
          <Field label="Date réalisée" value={vaccine.doneDate ?? "—"} />
          <Field label="Prochaine dose" value={vaccine.nextDose ?? "—"} />
          <Field label="Zone" value={vaccine.location} />
          <div className="col-span-2 rounded-2xl bg-sand p-3 leading-tight">
            <dt className="text-xs font-semibold text-earth/50">Numéro de lot</dt>
            <dd className="mt-0.5 font-mono font-semibold text-earth">
              {vaccine.batchNumber ?? "—"}
              {!vaccine.batchNumber && (
                <span className="ml-2 font-sans text-xs font-medium text-earth/40">
                  (à renseigner)
                </span>
              )}
            </dd>
          </div>
        </dl>
      </Panel>

      {/* Notes */}
      {vaccine.notes && (
        <Panel icon="📝" title="Notes">
          <p className="text-sm text-earth">{vaccine.notes}</p>
        </Panel>
      )}

      {/* Agent contact */}
      <Panel icon="📇" title="Agent / vétérinaire">
        <ContactButton contact={vaccine.agent} />
      </Panel>
    </div>
  );
}
