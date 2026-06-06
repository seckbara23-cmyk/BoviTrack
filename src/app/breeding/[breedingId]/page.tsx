import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/common/Badge";
import { Panel } from "@/components/common/Panel";
import { Field } from "@/components/common/Field";
import { BackHeader } from "@/components/common/BackHeader";
import { ContactButton } from "@/components/security/ContactButton";
import { BreedingActions } from "@/components/breeding/BreedingActions";
import {
  getBreedingById,
  getAnimalById,
  getBirthsByMother,
  breedingRecords,
  breedingStatusMeta,
} from "@/lib/mock-data";

export function generateStaticParams() {
  return breedingRecords.map((b) => ({ breedingId: b.id }));
}

export default async function BreedingDetailPage({
  params,
}: {
  params: Promise<{ breedingId: string }>;
}) {
  const { breedingId } = await params;
  const record = getBreedingById(breedingId);

  if (!record) {
    notFound();
  }

  const female = getAnimalById(record.femaleId);
  const father = record.fatherId ? getAnimalById(record.fatherId) : undefined;
  const status = breedingStatusMeta[record.status];
  // A birth linked to this breeding (via the mother + breedingId).
  const linkedBirth = getBirthsByMother(record.femaleId).find(
    (b) => b.breedingId === record.id,
  );

  return (
    <div className="space-y-5">
      <BackHeader href="/breeding" label="Reproduction" id={record.id} />

      {/* Female identity card → profile */}
      {female ? (
        <Link
          href={`/herd/${record.femaleId}`}
          className="tile-press flex items-center gap-4 rounded-3xl bg-white p-4 shadow-card hover:shadow-tile"
        >
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sand text-4xl" aria-hidden>
            {female.emoji}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <h1 className="truncate text-lg font-extrabold text-earth">{female.name}</h1>
            <p className="font-mono text-xs text-earth/50">{record.femaleId}</p>
            <p className="text-xs text-earth/60">
              ♀️ {female.identity.breed} · 📍 {record.location}
            </p>
          </div>
          <span className="text-sm font-semibold text-green">Voir 🐄 ›</span>
        </Link>
      ) : (
        <div className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-card">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sand text-4xl" aria-hidden>
            🐄
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <h1 className="truncate text-lg font-extrabold text-earth">{record.femaleName}</h1>
            <p className="font-mono text-xs text-earth/50">{record.femaleId}</p>
            <p className="text-xs text-earth/60">
              ♀️ {record.femaleBreed} · 📍 {record.location}
            </p>
          </div>
        </div>
      )}

      {/* Status header */}
      <section className="rounded-3xl bg-white p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden>
            {record.status === "echec" ? "❌" : "🤰"}
          </span>
          <div className="leading-tight">
            <p className="text-xs font-semibold uppercase tracking-wide text-earth/50">
              {record.method}
            </p>
            <h2 className="text-xl font-extrabold text-earth">
              {record.expectedBirth
                ? `Mise bas prévue : ${record.expectedBirth}`
                : "Gestation à confirmer"}
            </h2>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge {...status} />
          {record.overdue && (
            <span className="rounded-full bg-alert/10 px-3 py-1.5 text-sm font-bold text-alert">
              ⚠️ En retard
            </span>
          )}
        </div>
      </section>

      {/* Actions */}
      <BreedingActions
        phone={record.vet.phone}
        femaleId={record.femaleId}
        femaleRegistered={Boolean(female)}
      />

      {/* Parents & dates */}
      <Panel icon="🐂" title="Reproduction">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Mère" value={record.femaleName} />
          <Field
            label="Père / taureau"
            value={father ? father.name : record.bullName ?? "Inconnu"}
          />
          <Field label="Méthode" value={record.method} />
          <Field label="Date de saillie" value={record.matingDate} />
          <Field label="Statut gestation" value={status.label} />
          <Field label="Mise bas prévue" value={record.expectedBirth ?? "—"} />
        </dl>
        {record.followUp && (
          <div className="mt-3 rounded-2xl bg-gold/15 p-3 text-sm text-gold-dark">
            <span className="font-bold">🔁 Suivi : </span>
            {record.followUp}
          </div>
        )}
      </Panel>

      {/* Linked birth, if any */}
      {linkedBirth && (
        <Link
          href={`/births/${linkedBirth.id}`}
          className="tile-press flex items-center gap-3 rounded-3xl bg-green-50 p-4 shadow-card hover:shadow-tile"
        >
          <span className="text-3xl" aria-hidden>👶</span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-xs font-semibold text-green">Naissance liée</div>
            <div className="truncate text-sm font-bold text-earth">
              {linkedBirth.calfName ?? "Veau"} · {linkedBirth.birthDate}
            </div>
          </div>
          <span aria-hidden className="text-green">›</span>
        </Link>
      )}

      {/* Vet / agent */}
      <Panel icon="📇" title="Agent / vétérinaire">
        <ContactButton contact={record.vet} />
      </Panel>

      {/* Timeline */}
      <Panel icon="🕒" title="Suivi de la reproduction">
        <ol className="relative space-y-4 border-l-2 border-sand-dark pl-5">
          {record.timeline.map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute -left-[27px] flex h-8 w-8 items-center justify-center rounded-full bg-sand text-base shadow-card">
                {event.icon}
              </span>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-earth">{event.label}</div>
                <div className="text-xs text-earth/50">{event.time}</div>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}
