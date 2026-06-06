import Link from "next/link";
import type { Animal, BreedingRecord, BirthRecord } from "@/lib/mock-data";
import { breedingStatusMeta, birthStatusMeta } from "@/lib/mock-data";
import { Badge } from "@/components/common/Badge";

/**
 * Reproduction summary on the animal profile, backed by real linked
 * breeding & birth records (Phase 4).
 * - Females: active gestation (expected birth + follow-up) and latest birth.
 * - Males: number of reproductions and offspring as the father.
 */
export function ReproductionPanel({
  animal,
  breedingAsFemale,
  breedingAsFather,
  birthsAsMother,
  birthsAsFather,
}: {
  animal: Animal;
  breedingAsFemale: BreedingRecord[];
  breedingAsFather: BreedingRecord[];
  birthsAsMother: BirthRecord[];
  birthsAsFather: BirthRecord[];
}) {
  const isFemale = animal.identity.sex === "F";

  const activeBreeding = breedingAsFemale.find(
    (b) =>
      b.status === "gestation" ||
      b.status === "a_surveiller" ||
      b.status === "mise_bas_proche",
  );
  const latestBirth = birthsAsMother[0];

  const fatherBreedingCount = breedingAsFather.length;
  const fatherBirthCount = birthsAsFather.length;

  return (
    <section className="rounded-3xl bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-earth">
          <span aria-hidden>❤️</span> Reproduction
        </h2>
        <span className="text-xs font-medium text-earth/50">
          {isFemale ? "Femelle ♀️" : "Mâle ♂️"}
        </span>
      </div>

      <div className="space-y-2">
        {isFemale ? (
          <>
            {/* Active gestation */}
            {activeBreeding ? (
              <Link
                href={`/breeding/${activeBreeding.id}`}
                className="flex items-center gap-3 rounded-2xl bg-green-50 p-3"
              >
                <span className="text-2xl" aria-hidden>🤰</span>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="text-xs font-semibold text-earth/50">
                    Gestation en cours
                  </div>
                  <div className="text-sm font-bold text-earth">
                    Mise bas prévue : {activeBreeding.expectedBirth ?? "—"}
                  </div>
                  <div className="mt-1">
                    <Badge {...breedingStatusMeta[activeBreeding.status]} size="sm" />
                  </div>
                </div>
                <span aria-hidden className="text-earth/30">›</span>
              </Link>
            ) : (
              <div className="rounded-2xl bg-sand p-3 text-sm text-earth/60">
                Aucune gestation en cours.
              </div>
            )}

            {/* Latest birth */}
            {latestBirth && (
              <Link
                href={`/births/${latestBirth.id}`}
                className="flex items-center gap-3 rounded-2xl bg-sand p-3"
              >
                <span className="text-2xl" aria-hidden>{latestBirth.icon}</span>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="text-xs font-semibold text-earth/50">
                    Dernière naissance
                  </div>
                  <div className="truncate text-sm font-bold text-earth">
                    {latestBirth.calfName ?? "Veau"}
                    {latestBirth.calfId && (
                      <span className="ml-1 font-mono text-xs font-normal text-earth/40">
                        {latestBirth.calfId}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge {...birthStatusMeta[latestBirth.status]} size="sm" />
                    <span className="text-xs text-earth/60">📅 {latestBirth.birthDate}</span>
                  </div>
                </div>
                <span aria-hidden className="text-earth/30">›</span>
              </Link>
            )}
          </>
        ) : (
          /* Male — father role */
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/breeding"
              className="rounded-2xl bg-sand p-3 leading-tight"
            >
              <div className="text-xs font-semibold text-earth/50">Reproductions</div>
              <div className="text-xl font-extrabold text-earth">
                {fatherBreedingCount} 🤰
              </div>
            </Link>
            <Link
              href="/births"
              className="rounded-2xl bg-sand p-3 leading-tight"
            >
              <div className="text-xs font-semibold text-earth/50">Veaux (père)</div>
              <div className="text-xl font-extrabold text-earth">
                {fatherBirthCount} 🐮
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Links to modules */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link
          href="/breeding"
          className="tile-press flex items-center justify-center gap-2 rounded-2xl bg-green px-4 py-3 text-sm font-bold text-white shadow-tile hover:bg-green-dark"
        >
          <span aria-hidden>🐄🐂</span> Reproduction
        </Link>
        <Link
          href="/births"
          className="tile-press flex items-center justify-center gap-2 rounded-2xl bg-gold px-4 py-3 text-sm font-bold text-earth shadow-tile hover:bg-gold-dark hover:text-white"
        >
          <span aria-hidden>👶</span> Naissances
        </Link>
      </div>
    </section>
  );
}
