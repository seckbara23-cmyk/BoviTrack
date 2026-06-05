import { alerts } from "@/lib/mock-data";

export default function AlertsPage() {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-earth">
          <span aria-hidden>🚨</span> Alertes
        </h1>
        <p className="text-sm text-earth/60">
          {alerts.length} alertes actives (données fictives)
        </p>
      </header>

      <ul className="space-y-3">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className={`flex items-start gap-4 rounded-3xl p-4 shadow-card ${
              alert.level === "danger" ? "bg-alert/10" : "bg-gold/15"
            }`}
          >
            <span className="text-4xl" aria-hidden>
              {alert.icon}
            </span>
            <div className="leading-tight">
              <div
                className={`text-base font-bold ${
                  alert.level === "danger" ? "text-alert" : "text-gold-dark"
                }`}
              >
                {alert.title}
              </div>
              <p className="mt-0.5 text-sm text-earth/70">{alert.detail}</p>
              <p className="mt-1 text-xs font-medium text-earth/50">
                📍 {alert.location}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
