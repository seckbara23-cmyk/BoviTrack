import { ActionTile } from "@/components/dashboard/ActionTile";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { ListenButton } from "@/components/common/ListenButton";
import { EmergencyTile } from "@/components/security/EmergencyTile";
import { StatusBadge } from "@/components/security/StatusBadge";
import Link from "next/link";
import {
  dashboardActions,
  herdStats,
  careKpis,
  vaccinationsPending,
  activeAlertCount,
  upcomingTasks,
  theftAlerts,
} from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Greeting + voice-first entry point */}
      <section className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-green to-green-dark p-5 text-white shadow-tile sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">Bonjour 👋</p>
          <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight">
            Votre cheptel aujourd&apos;hui
          </h1>
          <p className="mt-1 text-sm text-white/80">
            Touchez une image pour commencer.
          </p>
        </div>
        <ListenButton />
      </section>

      {/* Anti-theft — highest-priority feature, loudest on the screen */}
      <EmergencyTile />

      {/* Summary cards — tappable, reflecting live mock data */}
      <section aria-label="Résumé du troupeau">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link href="/herd">
            <SummaryCard icon="🐄" value={herdStats.total} label="Total animaux" tone="ok" />
          </Link>
          <Link href="/care">
            <SummaryCard icon="🤒" value={careKpis.animauxMalades} label="Animaux malades" tone="alert" />
          </Link>
          <Link href="/vaccines">
            <SummaryCard icon="🧪" value={vaccinationsPending} label="Vaccins à faire" tone="warning" />
          </Link>
          <Link href="/alerts">
            <SummaryCard icon="🚨" value={activeAlertCount} label="Alertes vol" tone="alert" />
          </Link>
        </div>
      </section>

      {/* Main action tiles */}
      <section aria-label="Actions principales">
        <h2 className="mb-3 text-lg font-bold text-earth">Que faire ?</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {dashboardActions.map((action) => (
            <ActionTile key={action.href + action.label} action={action} />
          ))}
        </div>
      </section>

      {/* Upcoming tasks + active alerts, side by side on desktop */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-4 shadow-card">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-earth">
            <span aria-hidden>📅</span> À faire bientôt
          </h2>
          <ul className="space-y-2">
            {upcomingTasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={task.href}
                  className="flex items-center gap-3 rounded-2xl bg-sand p-3"
                >
                  <span className="text-2xl" aria-hidden>
                    {task.icon}
                  </span>
                  <div className="flex-1 leading-tight">
                    <div className="text-sm font-semibold text-earth">
                      {task.label}
                    </div>
                    <div className="text-xs text-earth/60">{task.due}</div>
                  </div>
                  <span aria-hidden className="text-earth/40">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-earth">
              <span aria-hidden>🚨</span> Alertes vol
            </h2>
            <Link href="/alerts" className="text-sm font-semibold text-alert">
              Tout voir ›
            </Link>
          </div>
          <ul className="space-y-2">
            {theftAlerts.slice(0, 3).map((alert) => (
              <li key={alert.id}>
                <Link
                  href={`/alerts/${alert.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-sand p-3"
                >
                  <span className="text-2xl" aria-hidden>
                    {alert.animalEmoji}
                  </span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-sm font-bold text-earth">
                      {alert.animalName}{" "}
                      <span className="font-normal text-earth/50">
                        · 📍 {alert.lastKnownLocation}
                      </span>
                    </div>
                    <div className="mt-1">
                      <StatusBadge status={alert.status} size="sm" />
                    </div>
                  </div>
                  <span aria-hidden className="text-earth/30">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
