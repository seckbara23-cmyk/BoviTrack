import Link from "next/link";
import { notFound } from "next/navigation";
import { SecurityPanel } from "@/components/herd/SecurityPanel";
import { AnimalQuickActions } from "@/components/herd/AnimalQuickActions";
import { HealthPanel } from "@/components/herd/HealthPanel";
import { ReproductionPanel } from "@/components/herd/ReproductionPanel";
import { ContactButton } from "@/components/security/ContactButton";
import {
  getAnimalById,
  animals,
  animalAge,
  locationRiskMeta,
  eventTypeMeta,
  getCareByAnimal,
  getVaccinesByAnimal,
  getBreedingByFemale,
  getBreedingByFather,
  getBirthsByMother,
  getBirthsByFather,
} from "@/lib/mock-data";

export function generateStaticParams() {
  return animals.map((a) => ({ animalId: a.id }));
}

/** Small labelled field used inside the info panels. */
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

export default async function AnimalProfilePage({
  params,
}: {
  params: Promise<{ animalId: string }>;
}) {
  const { animalId } = await params;
  const animal = getAnimalById(animalId);

  if (!animal) {
    notFound();
  }

  const { identity, ownership, location } = animal;
  const risk = locationRiskMeta[location.risk];
  const care = getCareByAnimal(animal.id);
  const vaccines = getVaccinesByAnimal(animal.id);
  const breedingAsFemale = getBreedingByFemale(animal.id);
  const breedingAsFather = getBreedingByFather(animal.id);
  const birthsAsMother = getBirthsByMother(animal.id);
  const birthsAsFather = getBirthsByFather(animal.id);

  return (
    <div className="space-y-5">
      {/* Back + id */}
      <div className="flex items-center justify-between">
        <Link
          href="/herd"
          className="flex items-center gap-1.5 text-sm font-semibold text-earth/70"
        >
          <span aria-hidden>‹</span> Mon troupeau
        </Link>
        <span className="font-mono text-xs text-earth/40">{animal.id}</span>
      </div>

      {/* Header / identity at a glance */}
      <section className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-card">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-sand text-5xl" aria-hidden>
          {animal.emoji}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-earth">{animal.name}</h1>
            <span className="text-lg text-earth/40" aria-hidden>
              {identity.sex === "F" ? "♀️" : "♂️"}
            </span>
          </div>
          <p className="text-sm text-earth/70">
            🧬 {identity.breed} · {animalAge(identity.birthYear)} ans
          </p>
          <p className="font-mono text-xs text-earth/50">🏷 {identity.rfid}</p>
        </div>
      </section>

      {/* SECURITY — top priority */}
      <SecurityPanel animal={animal} />

      {/* Quick actions */}
      <AnimalQuickActions alertId={animal.security.alertId} />

      {/* Identity */}
      <Panel icon="🪪" title="Identité">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Identifiant" value={<span className="font-mono">{animal.id}</span>} />
          <Field label="RFID" value={<span className="font-mono">{identity.rfid}</span>} />
          <Field label="Race" value={identity.breed} />
          <Field label="Sexe" value={identity.sex === "F" ? "Femelle ♀️" : "Mâle ♂️"} />
          <Field label="Âge" value={`${animalAge(identity.birthYear)} ans (${identity.birthYear})`} />
          <Field label="Robe / marques" value={identity.color} />
          <Field label="Enregistré le" value={identity.registeredAt} />
          <div className="rounded-2xl bg-sand p-3 leading-tight">
            <dt className="text-xs font-semibold text-earth/50">QR Code</dt>
            <dd className="mt-1 flex items-center gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl shadow-card" aria-hidden>
                🔳
              </span>
              <span className="font-mono text-xs text-earth/60">
                {identity.qrCode}
                <br />
                <span className="text-earth/40">QR bientôt</span>
              </span>
            </dd>
          </div>
        </dl>

        {/* Photo placeholder */}
        <div className="mt-3 flex h-32 items-center justify-center rounded-2xl bg-sand text-center text-sm font-medium text-earth/50">
          <span>
            📷 Photo bientôt disponible
          </span>
        </div>
      </Panel>

      {/* Owner */}
      <Panel icon="👤" title="Propriétaire & berger">
        <div className="space-y-3">
          <ContactButton contact={ownership.owner} />
          <ContactButton contact={ownership.herder} />
          <div className="rounded-2xl bg-sand p-3 text-sm">
            <span className="text-xs font-semibold text-earth/50">Zone</span>
            <p className="font-semibold text-earth">📍 {ownership.location}</p>
          </div>
        </div>
      </Panel>

      {/* Location */}
      <Panel icon="📍" title="Localisation">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Zone actuelle" value={ownership.location} />
          <Field label="Dernière position" value={location.zone} />
          <Field label="Mise à jour" value={location.lastUpdate} />
          <div className="rounded-2xl bg-sand p-3 leading-tight">
            <dt className="text-xs font-semibold text-earth/50">Niveau de risque</dt>
            <dd className="mt-1">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${risk.className}`}>
                <span aria-hidden>{risk.emoji}</span>
                {risk.label}
              </span>
            </dd>
          </div>
        </dl>
        <Link
          href="/location"
          className="tile-press mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-green px-4 py-3 text-sm font-bold text-white shadow-tile hover:bg-green-dark"
        >
          <span aria-hidden>🗺️</span> Voir sur la carte
        </Link>
      </Panel>

      {/* Health summary — real linked care & vaccine records (Phase 3) */}
      <HealthPanel animal={animal} care={care} vaccines={vaccines} />

      {/* Reproduction summary — real linked records (Phase 4) */}
      <ReproductionPanel
        animal={animal}
        breedingAsFemale={breedingAsFemale}
        breedingAsFather={breedingAsFather}
        birthsAsMother={birthsAsMother}
        birthsAsFather={birthsAsFather}
      />

      {/* Timeline */}
      <Panel icon="🕒" title="Historique">
        <ol className="relative space-y-4 border-l-2 border-sand-dark pl-5">
          {animal.timeline.map((event) => {
            const meta = eventTypeMeta[event.type];
            return (
              <li key={event.id} className="relative">
                <span className={`absolute -left-[27px] flex h-8 w-8 items-center justify-center rounded-full text-base shadow-card ${meta.tone}`}>
                  {meta.icon}
                </span>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-earth">
                    {event.label}
                  </div>
                  <div className="text-xs text-earth/50">{event.time}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </Panel>
    </div>
  );
}
