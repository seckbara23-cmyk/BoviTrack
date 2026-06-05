import { AlertsActions } from "@/components/security/AlertsActions";
import { AlertCard } from "@/components/security/AlertCard";
import { theftAlerts, activeAlertCount } from "@/lib/mock-data";

export default function AlertsPage() {
  // Phone of the responder for the first active alert (quick "Appeler").
  const responderTel =
    theftAlerts.find((a) => a.status !== "retrouve" && a.status !== "cloturee")
      ?.herder.phone ?? theftAlerts[0].herder.phone;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-earth">
          <span aria-hidden>🚨</span> Vol / Alerte
        </h1>
        <p className="text-sm text-earth/60">
          {activeAlertCount} alerte(s) en cours · données fictives
        </p>
      </header>

      <AlertsActions responderTel={responderTel} />

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-earth">Alertes actives</h2>
        <div className="space-y-3">
          {theftAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </section>
    </div>
  );
}
