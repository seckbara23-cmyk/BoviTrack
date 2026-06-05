import { ActionTile } from "@/components/dashboard/ActionTile";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { ListenButton } from "@/components/common/ListenButton";
import {
  dashboardActions,
  herdSummary,
  upcomingTasks,
  alerts,
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

      {/* Summary cards */}
      <section aria-label="Résumé du troupeau">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard
            icon="🐄"
            value={herdSummary.totalAnimaux}
            label="Total animaux"
            tone="ok"
          />
          <SummaryCard
            icon="🤒"
            value={herdSummary.animauxMalades}
            label="Animaux malades"
            tone="alert"
          />
          <SummaryCard
            icon="🧪"
            value={herdSummary.vaccinationsAFaire}
            label="Vaccins à faire"
            tone="warning"
          />
          <SummaryCard
            icon="🚨"
            value={herdSummary.alertesSecurite}
            label="Alertes sécurité"
            tone="alert"
          />
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
              <li
                key={task.id}
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
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-card">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-earth">
            <span aria-hidden>🚨</span> Alertes
          </h2>
          <ul className="space-y-2">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className={`flex items-start gap-3 rounded-2xl p-3 ${
                  alert.level === "danger"
                    ? "bg-alert/10"
                    : "bg-gold/15"
                }`}
              >
                <span className="text-2xl" aria-hidden>
                  {alert.icon}
                </span>
                <div className="leading-tight">
                  <div
                    className={`text-sm font-bold ${
                      alert.level === "danger" ? "text-alert" : "text-gold-dark"
                    }`}
                  >
                    {alert.title}
                  </div>
                  <div className="text-xs text-earth/70">{alert.detail}</div>
                  <div className="mt-1 text-[11px] font-medium text-earth/50">
                    📍 {alert.location}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
