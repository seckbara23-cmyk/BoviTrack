import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/common/Badge";
import { Panel } from "@/components/common/Panel";
import { Field } from "@/components/common/Field";
import { BackHeader } from "@/components/common/BackHeader";
import { BirthActions } from "@/components/births/BirthActions";
import {
  getBirthById,
  getAnimalById,
  birthRecords,
  birthStatusMeta,
} from "@/lib/mock-data";

export function generateStaticParams() {
  return birthRecords.map((b) => ({ birthId: b.id }));
}

export default async function BirthDetailPage({
  params,
}: {
  params: Promise<{ birthId: string }>;
}) {
  const { birthId } = await params;
  const record = getBirthById(birthId);

  if (!record) {
    notFound();
  }

  const mother = getAnimalById(record.motherId);
  const father = record.fatherId ? getAnimalById(record.fatherId) : undefined;
  const calfRegistered = record.calfId ? Boolean(getAnimalById(record.calfId)) : false;
  const status = birthStatusMeta[record.status];
  const isLoss = record.status === "mort_ne";

  return (
    <div className="space-y-5">
      <BackHeader href="/births" label="Naissances" id={record.id} />

      {/* Calf identity header */}
      <section
        className={`rounded-3xl p-5 shadow-card ${isLoss ? "bg-alert/5 ring-2 ring-alert/40" : "bg-white"}`}
      >
        <div className="flex items-center gap-4">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-sand text-5xl" aria-hidden>
            {record.icon}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-earth">
                {record.calfName ?? "Veau"}
              </h1>
              <span className="text-lg text-earth/40" aria-hidden>
                {record.sex === "F" ? "♀️" : "♂️"}
              </span>
            </div>
            <p className="font-mono text-xs text-earth/50">
              {record.calfId ?? "Identifiant à attribuer"}
            </p>
            <p className="text-sm text-earth/70">🧬 {record.breed} · 📅 {record.birthDate}</p>
            <div className="mt-2">
              <Badge {...status} />
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <BirthActions
        motherId={record.motherId}
        motherRegistered={Boolean(mother)}
        calfId={record.calfId}
        calfRegistered={calfRegistered}
      />

      {/* Mother identity → profile */}
      {mother ? (
        <Link
          href={`/herd/${record.motherId}`}
          className="tile-press flex items-center gap-4 rounded-3xl bg-white p-4 shadow-card hover:shadow-tile"
        >
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sand text-4xl" aria-hidden>
            {mother.emoji}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-xs font-semibold text-earth/50">Mère</div>
            <h2 className="truncate text-lg font-extrabold text-earth">{mother.name}</h2>
            <p className="font-mono text-xs text-earth/50">{record.motherId}</p>
          </div>
          <span className="text-sm font-semibold text-green">Voir 🐄 ›</span>
        </Link>
      ) : (
        <div className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-card">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sand text-4xl" aria-hidden>
            🐄
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-xs font-semibold text-earth/50">Mère</div>
            <h2 className="truncate text-lg font-extrabold text-earth">{record.motherName}</h2>
            <p className="font-mono text-xs text-earth/50">{record.motherId}</p>
          </div>
        </div>
      )}

      {/* Details */}
      <Panel icon="📋" title="Détails de la naissance">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Sexe" value={record.sex === "F" ? "Femelle ♀️" : "Mâle ♂️"} />
          <Field label="Race" value={record.breed} />
          <Field label="Date de naissance" value={record.birthDate} />
          <Field label="Zone" value={record.location} />
          <Field label="Père" value={father ? father.name : record.fatherName ?? "Inconnu"} />
          <Field label="Issue" value={status.label} />
          <Field label="Propriétaire" value={record.ownerName} />
          <Field label="Berger" value={record.herderName} />
        </dl>
      </Panel>

      {/* Health note */}
      <Panel icon="🩺" title="Note de santé">
        <div
          className={`rounded-2xl p-3 text-sm ${
            isLoss ? "bg-alert/10 text-alert" : "bg-sand text-earth"
          }`}
        >
          {record.healthNote}
        </div>
      </Panel>

      {/* Related breeding record */}
      {record.breedingId && (
        <Link
          href={`/breeding/${record.breedingId}`}
          className="tile-press flex items-center gap-3 rounded-3xl bg-white p-4 shadow-card hover:shadow-tile"
        >
          <span className="text-3xl" aria-hidden>🤰</span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-xs font-semibold text-earth/50">Reproduction liée</div>
            <div className="truncate font-mono text-sm font-bold text-earth">
              {record.breedingId}
            </div>
          </div>
          <span aria-hidden className="text-earth/30">›</span>
        </Link>
      )}
    </div>
  );
}
