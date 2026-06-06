import Link from "next/link";
import type { Animal } from "@/lib/mock-data";
import { securityStatusMeta } from "@/lib/mock-data";

/**
 * TOP-PRIORITY panel on the animal profile. Anti-theft status is the
 * first thing a user should see — colour-coded, with a direct link to
 * the live alert when one is active.
 */
export function SecurityPanel({ animal }: { animal: Animal }) {
  const sec = securityStatusMeta[animal.security.status];
  const isAlert = animal.security.status === "alerte";

  return (
    <section
      className={`rounded-3xl p-5 shadow-tile ring-2 ${
        isAlert ? "bg-alert/5 " + sec.ring : "bg-white " + sec.ring
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-4xl" aria-hidden>
          {sec.emoji}
        </span>
        <div className="leading-tight">
          <p className="text-xs font-semibold uppercase tracking-wide text-earth/50">
            Sécurité
          </p>
          <h2
            className={`text-xl font-extrabold ${
              isAlert ? "text-alert" : "text-earth"
            }`}
          >
            {sec.label}
          </h2>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {isAlert && animal.security.alertId && (
          <div className="col-span-2 rounded-2xl bg-alert/10 p-3">
            <dt className="text-xs font-semibold text-alert/70">Référence</dt>
            <dd className="font-mono font-bold text-alert">
              {animal.security.alertId}
            </dd>
          </div>
        )}
        <div className="rounded-2xl bg-sand p-3">
          <dt className="text-xs font-semibold text-earth/50">
            Dernière position
          </dt>
          <dd className="font-semibold text-earth">
            {animal.security.lastKnownLocation}
          </dd>
        </div>
        <div className="rounded-2xl bg-sand p-3">
          <dt className="text-xs font-semibold text-earth/50">Mise à jour</dt>
          <dd className="font-semibold text-earth">
            {animal.security.lastUpdate}
          </dd>
        </div>
      </dl>

      {isAlert && animal.security.alertId && (
        <Link
          href={`/alerts/${animal.security.alertId}`}
          className="tile-press mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-alert px-4 py-3 text-base font-bold text-white shadow-tile hover:bg-alert-dark"
        >
          <span aria-hidden>🚨</span> Voir alerte
        </Link>
      )}
    </section>
  );
}
