import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/common/Badge";
import { ContactButton } from "@/components/security/ContactButton";
import { RecordActions } from "@/components/common/RecordActions";
import {
  getCareById,
  getAnimalById,
  careRecords,
  careStatusMeta,
} from "@/lib/mock-data";

export function generateStaticParams() {
  return careRecords.map((c) => ({ careId: c.id }));
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

export default async function CareDetailPage({
  params,
}: {
  params: Promise<{ careId: string }>;
}) {
  const { careId } = await params;
  const care = getCareById(careId);

  if (!care) {
    notFound();
  }

  const animal = getAnimalById(care.animalId);
  const status = careStatusMeta[care.status];
  const isDone = care.status === "termine";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/care" className="flex items-center gap-1.5 text-sm font-semibold text-earth/70">
          <span aria-hidden>‹</span> Soins
        </Link>
        <span className="font-mono text-xs text-earth/40">{care.id}</span>
      </div>

      {/* Animal identity card → link to profile */}
      <Link
        href={`/herd/${care.animalId}`}
        className="tile-press flex items-center gap-4 rounded-3xl bg-white p-4 shadow-card hover:shadow-tile"
      >
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sand text-4xl" aria-hidden>
          {animal ? animal.emoji : "🐄"}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <h1 className="truncate text-lg font-extrabold text-earth">
            {animal ? animal.name : care.animalId}
          </h1>
          <p className="font-mono text-xs text-earth/50">{care.animalId}</p>
          {animal && (
            <p className="text-xs text-earth/60">
              🧬 {animal.identity.breed} · 📍 {animal.ownership.location}
            </p>
          )}
        </div>
        <span className="text-sm font-semibold text-green">Voir 🐄 ›</span>
      </Link>

      {/* Diagnosis header */}
      <section className="rounded-3xl bg-white p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden>
            {care.icon}
          </span>
          <div className="leading-tight">
            <p className="text-xs font-semibold uppercase tracking-wide text-earth/50">
              {care.category}
            </p>
            <h2 className="text-xl font-extrabold text-earth">{care.reason}</h2>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge {...status} />
          <span className="text-sm text-earth/60">📅 {care.date}</span>
        </div>
      </section>

      {/* Actions */}
      <RecordActions
        phone={care.vet.phone}
        callLabel="Appeler vétérinaire"
        animalId={care.animalId}
        doneLabel={isDone ? "Terminé" : "Marquer terminé"}
        doneHint="Bientôt : clôturer le soin et notifier le propriétaire."
        isDone={isDone}
      />

      {/* Symptoms */}
      <Panel icon="🩺" title="Symptômes">
        {care.symptoms.length === 0 ? (
          <p className="text-sm text-earth/60">Aucun symptôme signalé.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {care.symptoms.map((s) => (
              <span key={s} className="rounded-full bg-sand px-3 py-1.5 text-sm font-medium text-earth">
                {s}
              </span>
            ))}
          </div>
        )}
      </Panel>

      {/* Treatment */}
      <Panel icon="💊" title="Traitement">
        <p className="text-sm font-medium text-earth">{care.treatment}</p>
        {care.followUp && (
          <div className="mt-3 rounded-2xl bg-gold/15 p-3 text-sm text-gold-dark">
            <span className="font-bold">🔁 Suivi : </span>
            {care.followUp}
          </div>
        )}
      </Panel>

      {/* Vet contact */}
      <Panel icon="📇" title="Vétérinaire">
        <ContactButton contact={care.vet} />
      </Panel>

      {/* Documents placeholder */}
      <Panel icon="📎" title="Documents liés">
        <div className="flex flex-wrap gap-2">
          {(care.documents ?? ["Ordonnance", "Analyse"]).map((doc) => (
            <span
              key={doc}
              className="flex items-center gap-2 rounded-2xl bg-sand px-3 py-2 text-sm font-medium text-earth/60"
            >
              📄 {doc}
            </span>
          ))}
        </div>
        <p className="mt-3 rounded-full bg-gold/15 px-4 py-1.5 text-center text-xs font-medium text-gold-dark">
          🛠️ Pièces jointes bientôt disponibles
        </p>
      </Panel>
    </div>
  );
}
