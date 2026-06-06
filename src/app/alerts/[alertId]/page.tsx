import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/security/StatusBadge";
import { Panel } from "@/components/common/Panel";
import { BackHeader } from "@/components/common/BackHeader";
import { ContactButton } from "@/components/security/ContactButton";
import { AlertDetailActions } from "@/components/security/AlertDetailActions";
import { getAlertById, theftAlerts } from "@/lib/mock-data";

export function generateStaticParams() {
  return theftAlerts.map((a) => ({ alertId: a.id }));
}

export default async function AlertDetailPage({
  params,
}: {
  params: Promise<{ alertId: string }>;
}) {
  const { alertId } = await params;
  const alert = getAlertById(alertId);

  if (!alert) {
    notFound();
  }

  const isResolved = alert.status === "retrouve" || alert.status === "cloturee";

  return (
    <div className="space-y-6">
      <BackHeader href="/alerts" label="Alertes" id={alert.id} />

      {/* Animal identity */}
      <section className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-card">
        <span
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-alert/10 text-5xl"
          aria-hidden
        >
          {alert.animalEmoji}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <h1 className="text-2xl font-extrabold text-earth">
            {alert.animalName}
          </h1>
          <p className="font-mono text-xs text-earth/50">{alert.animalId}</p>
          <p className="mt-1 text-sm text-earth/70">🧬 {alert.breed}</p>
          <p className="text-xs text-earth/50">🏷️ {alert.tag}</p>
          <div className="mt-2">
            <StatusBadge status={alert.status} />
          </div>
          <Link
            href={`/herd/${alert.animalId}`}
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-green"
          >
            🐄 Voir la fiche de l&apos;animal ›
          </Link>
        </div>
      </section>

      {/* Actions */}
      <AlertDetailActions ownerTel={alert.owner.phone} isResolved={isResolved} />

      {/* Last known location */}
      <Panel icon="📍" title="Dernière position connue">
        <p className="text-sm font-semibold text-earth">
          {alert.lastKnownLocation}
        </p>
        <p className="text-xs text-earth/50">🕒 {alert.lastSeenAgo}</p>

        {/* Mock map placeholder */}
        <Link
          href="/location"
          className="tile-press mt-3 flex h-32 items-center justify-center rounded-2xl bg-sand text-center text-sm font-medium text-earth/60"
        >
          <span>
            🗺️ Carte bientôt disponible
            <br />
            <span className="text-xs">Toucher pour la localisation</span>
          </span>
        </Link>
      </Panel>

      {/* Contacts */}
      <Panel icon="📇" title="Responsables">
        <div className="space-y-3">
          <ContactButton contact={alert.owner} />
          <ContactButton contact={alert.herder} />
        </div>
      </Panel>

      {/* Timeline */}
      <Panel icon="🕒" title="Suivi de l'alerte">
        <ol className="relative space-y-4 border-l-2 border-sand-dark pl-5">
          {alert.timeline.map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute -left-[27px] flex h-8 w-8 items-center justify-center rounded-full bg-sand text-base shadow-card">
                {event.icon}
              </span>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-earth">
                  {event.label}
                </div>
                <div className="text-xs text-earth/50">{event.time}</div>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}
