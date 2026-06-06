import Link from "next/link";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { ListenButton } from "@/components/common/ListenButton";
import { StatusBadge } from "@/components/security/StatusBadge";
import { ReportSection } from "@/components/reports/ReportSection";
import { MetricRow } from "@/components/reports/MetricRow";
import { DistributionBar } from "@/components/reports/DistributionBar";
import {
  reportKpis,
  animalsByLocation,
  animalsByBreed,
  securityReport,
  healthReport,
  reproductionReport,
  salesReport,
  formatFcfa,
} from "@/lib/mock-data";

export default function ReportsPage() {
  const maxLocation = Math.max(...animalsByLocation.map((l) => l.count), 1);
  const maxBreed = Math.max(...animalsByBreed.map((b) => b.count), 1);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-earth">
            <span aria-hidden>📊</span> Résultats
          </h1>
          <p className="text-sm text-earth/60">Vue simple du troupeau</p>
        </div>
        <ListenButton compact />
      </header>

      {/* Big visual KPI cards */}
      <section aria-label="Chiffres clés">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Link href="/herd">
            <SummaryCard icon="🐄" value={reportKpis.total} label="Total animaux" tone="ok" />
          </Link>
          <Link href="/herd">
            <SummaryCard icon="🟢" value={reportKpis.securises} label="Sécurisés" tone="ok" />
          </Link>
          <Link href="/alerts">
            <SummaryCard icon="🔴" value={reportKpis.alertesVol} label="Alertes vol" tone="alert" />
          </Link>
          <Link href="/care">
            <SummaryCard icon="💉" value={reportKpis.soinsUrgents} label="Soins urgents" tone="alert" />
          </Link>
          <Link href="/vaccines">
            <SummaryCard icon="🧪" value={reportKpis.vaccinsEnRetard} label="Vaccins en retard" tone="warning" />
          </Link>
          <Link href="/breeding">
            <SummaryCard icon="🐄🐂" value={reportKpis.gestations} label="Gestations" tone="ok" />
          </Link>
          <Link href="/births">
            <SummaryCard icon="👶" value={reportKpis.naissances} label="Naissances" tone="ok" />
          </Link>
          <Link href="/sales">
            <SummaryCard icon="💰" value={reportKpis.ventes} label="Ventes" tone="ok" />
          </Link>
          <Link href="/sales">
            <SummaryCard icon="💵" value={formatFcfa(reportKpis.montantVentes)} label="Montant ventes" tone="ok" />
          </Link>
        </div>
      </section>

      {/* 1. Sécurité */}
      <ReportSection
        icon="🚨"
        title="Sécurité"
        links={[
          { href: "/alerts", label: "Voir alertes" },
          { href: "/location", label: "Voir localisation" },
        ]}
      >
        <div className="space-y-2">
          <MetricRow icon="🔴" label="Alertes vol actives" value={securityReport.activeAlerts.length} tone="alert" />
          <MetricRow icon="🟠" label="Animaux hors zone" value={securityReport.outsideZone} tone="warning" />
          <MetricRow icon="⏳" label="Positions GPS anciennes" value={securityReport.oldPositions} tone="warning" />
        </div>

        {securityReport.activeAlerts.length > 0 && (
          <ul className="mt-3 space-y-2">
            {securityReport.activeAlerts.map((alert) => (
              <li key={alert.id}>
                <Link
                  href={`/alerts/${alert.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-alert/5 p-3"
                >
                  <span className="text-2xl" aria-hidden>{alert.animalEmoji}</span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-sm font-bold text-earth">
                      {alert.animalName}{" "}
                      <span className="font-normal text-earth/50">· 📍 {alert.lastKnownLocation}</span>
                    </div>
                    <div className="mt-1">
                      <StatusBadge status={alert.status} size="sm" />
                    </div>
                  </div>
                  <span aria-hidden className="text-earth/30">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </ReportSection>

      {/* 2. Santé & Vaccins */}
      <ReportSection
        icon="💉"
        title="Santé & Vaccins"
        links={[
          { href: "/care", label: "Voir soins" },
          { href: "/vaccines", label: "Voir vaccins" },
        ]}
      >
        <div className="space-y-2">
          <MetricRow icon="🤒" label="Animaux malades" value={healthReport.sick} tone="alert" />
          <MetricRow icon="🚑" label="Soins urgents" value={healthReport.urgentCare} tone="alert" />
          <MetricRow icon="⏰" label="Vaccins en retard" value={healthReport.overdueVaccines} tone="warning" />
          <MetricRow icon="🧪" label="Prochains vaccins" value={healthReport.nextVaccines} tone="ok" />
        </div>
      </ReportSection>

      {/* 3. Reproduction & Naissances */}
      <ReportSection
        icon="🐄🐂"
        title="Reproduction & Naissances"
        links={[
          { href: "/breeding", label: "Voir reproduction" },
          { href: "/births", label: "Voir naissances" },
        ]}
      >
        <div className="space-y-2">
          <MetricRow icon="🤰" label="Vaches gestantes" value={reproductionReport.pregnant} tone="ok" />
          <MetricRow icon="🍼" label="Mises bas proches" value={reproductionReport.expectedSoon} tone="warning" />
          <MetricRow icon="👶" label="Naissances ce mois" value={reproductionReport.birthsThisMonth} tone="ok" />
          <MetricRow icon="🔁" label="Suivi requis" value={reproductionReport.followUp} tone="alert" />
        </div>
      </ReportSection>

      {/* 4. Ventes & Transferts */}
      <ReportSection
        icon="💰"
        title="Ventes & Transferts"
        links={[{ href: "/sales", label: "Voir ventes" }]}
      >
        <div className="space-y-2">
          <MetricRow icon="💰" label="Ventes ce mois" value={salesReport.thisMonth} tone="ok" />
          <MetricRow icon="💵" label="Revenu total" value={formatFcfa(salesReport.totalRevenue)} tone="ok" />
          <MetricRow icon="🔄" label="Transferts en attente" value={salesReport.pendingTransfers} tone="warning" />
          <MetricRow icon="💸" label="Problèmes de paiement" value={salesReport.paymentIssues} tone="alert" />
        </div>
      </ReportSection>

      {/* 5. Troupeau par zone */}
      <ReportSection
        icon="📍"
        title="Troupeau par zone"
        links={[{ href: "/herd", label: "Voir troupeau" }]}
      >
        <div className="space-y-2.5">
          {animalsByLocation.map((row) => (
            <DistributionBar
              key={row.location}
              label={row.location}
              count={row.count}
              max={maxLocation}
              color="bg-green"
            />
          ))}
        </div>
      </ReportSection>

      {/* 6. Troupeau par race */}
      <ReportSection
        icon="🧬"
        title="Troupeau par race"
        links={[{ href: "/herd", label: "Voir troupeau" }]}
      >
        <div className="space-y-2.5">
          {animalsByBreed.map((row) => (
            <DistributionBar
              key={row.breed}
              label={row.breed}
              count={row.count}
              max={maxBreed}
              color="bg-gold"
            />
          ))}
        </div>
      </ReportSection>
    </div>
  );
}
