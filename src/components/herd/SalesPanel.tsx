import Link from "next/link";
import type { SaleRecord } from "@/lib/mock-data";
import { saleStatusMeta, formatFcfa } from "@/lib/mock-data";
import { Badge } from "@/components/common/Badge";

/**
 * Sales / ownership-transfer summary on the animal profile (Phase 5).
 * Shows the latest sale (buyer, price, transfer status) when the animal
 * has been sold, or a friendly empty state otherwise.
 */
export function SalesPanel({ sales }: { sales: SaleRecord[] }) {
  const latest = sales[0];

  return (
    <section className="rounded-3xl bg-white p-4 shadow-card">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-earth">
        <span aria-hidden>💰</span> Ventes & transfert
      </h2>

      {latest ? (
        <Link
          href={`/sales/${latest.id}`}
          className="flex items-center gap-3 rounded-2xl bg-sand p-3"
        >
          <span className="text-2xl" aria-hidden>🤝</span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-xs font-semibold text-earth/50">
              Dernière vente · {latest.saleDate}
            </div>
            <div className="truncate text-sm font-bold text-earth">
              💰 {formatFcfa(latest.priceFcfa)} · Acheteur : {latest.buyer.name}
            </div>
            <div className="mt-1">
              <Badge {...saleStatusMeta[latest.status]} size="sm" />
            </div>
          </div>
          <span aria-hidden className="text-earth/30">›</span>
        </Link>
      ) : (
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-sand p-5 text-center">
          <span className="text-3xl" aria-hidden>🐄</span>
          <p className="text-sm font-semibold text-earth">Aucune vente enregistrée</p>
          <p className="text-xs text-earth/60">Cet animal fait partie du troupeau.</p>
        </div>
      )}

      <Link
        href="/sales"
        className="tile-press mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-green px-4 py-3 text-sm font-bold text-white shadow-tile hover:bg-green-dark"
      >
        <span aria-hidden>💰</span> Toutes les ventes
      </Link>
    </section>
  );
}
