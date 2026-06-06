import Link from "next/link";
import type { SaleRecord } from "@/lib/mock-data";
import { saleStatusMeta, formatFcfa } from "@/lib/mock-data";
import { Badge } from "@/components/common/Badge";

/** Large, visual sale card. Cancelled / payment-issue records stand out. */
export function SaleCard({ sale }: { sale: SaleRecord }) {
  const status = saleStatusMeta[sale.status];
  const isAlert = sale.status === "annule" || sale.status === "paiement_attente";

  return (
    <Link
      href={`/sales/${sale.id}`}
      className={`tile-press block rounded-3xl p-4 shadow-card ring-2 transition-shadow hover:shadow-tile ${
        isAlert ? "bg-alert/5 ring-alert/50" : "bg-white ring-transparent"
      }`}
    >
      <div className="flex items-center gap-4">
        <span
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl ${
            isAlert ? "bg-alert/10" : "bg-sand"
          }`}
          aria-hidden
        >
          {sale.animalEmoji}
        </span>

        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-bold text-earth">
              {sale.animalName}
            </h3>
            <span className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-semibold text-earth/70">
              🧬 {sale.animalBreed}
            </span>
          </div>
          <p className="font-mono text-xs text-earth/40">{sale.animalId}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-earth/70">
            <span>🧑‍🌾 {sale.seller.name}</span>
            <span>🤝 {sale.buyer.name}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-earth/60">
            <span>📅 {sale.saleDate}</span>
            <span>📍 {sale.market}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-green/10 px-2.5 py-1 text-xs font-bold text-green">
              💰 {formatFcfa(sale.priceFcfa)}
            </span>
            <Badge {...status} size="sm" />
          </div>
        </div>

        <span className="shrink-0 rounded-xl bg-green px-3 py-1.5 text-xs font-bold text-white">
          Voir
        </span>
      </div>
    </Link>
  );
}
