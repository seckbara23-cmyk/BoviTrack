import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/common/Badge";
import { ContactButton } from "@/components/security/ContactButton";
import { SaleActions } from "@/components/sales/SaleActions";
import {
  getSaleById,
  getAnimalById,
  saleRecords,
  saleStatusMeta,
  formatFcfa,
} from "@/lib/mock-data";

export function generateStaticParams() {
  return saleRecords.map((s) => ({ saleId: s.id }));
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-sand p-3 leading-tight">
      <dt className="text-xs font-semibold text-earth/50">{label}</dt>
      <dd className="mt-0.5 font-semibold text-earth">{value}</dd>
    </div>
  );
}

function Panel({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-card">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-earth">
        <span aria-hidden>{icon}</span> {title}
      </h2>
      {children}
    </section>
  );
}

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ saleId: string }>;
}) {
  const { saleId } = await params;
  const sale = getSaleById(saleId);

  if (!sale) {
    notFound();
  }

  const animal = getAnimalById(sale.animalId);
  const status = saleStatusMeta[sale.status];
  const isTransferred = sale.status === "transfere";
  const isAlert = sale.status === "annule" || sale.status === "paiement_attente";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/sales" className="flex items-center gap-1.5 text-sm font-semibold text-earth/70">
          <span aria-hidden>‹</span> Ventes
        </Link>
        <span className="font-mono text-xs text-earth/40">{sale.id}</span>
      </div>

      {/* Animal identity card → profile */}
      {animal ? (
        <Link
          href={`/herd/${sale.animalId}`}
          className="tile-press flex items-center gap-4 rounded-3xl bg-white p-4 shadow-card hover:shadow-tile"
        >
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sand text-4xl" aria-hidden>
            {animal.emoji}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <h1 className="truncate text-lg font-extrabold text-earth">{animal.name}</h1>
            <p className="font-mono text-xs text-earth/50">{sale.animalId}</p>
            <p className="text-xs text-earth/60">🧬 {animal.identity.breed} · 📍 {sale.location}</p>
          </div>
          <span className="text-sm font-semibold text-green">Voir 🐄 ›</span>
        </Link>
      ) : (
        <div className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-card">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sand text-4xl" aria-hidden>
            {sale.animalEmoji}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <h1 className="truncate text-lg font-extrabold text-earth">{sale.animalName}</h1>
            <p className="font-mono text-xs text-earth/50">{sale.animalId}</p>
            <p className="text-xs text-earth/60">🧬 {sale.animalBreed} · 📍 {sale.location}</p>
          </div>
        </div>
      )}

      {/* Price + status header */}
      <section
        className={`rounded-3xl p-5 shadow-card ${isAlert ? "bg-alert/5 ring-2 ring-alert/40" : "bg-white"}`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-earth/50">
          Prix de vente
        </p>
        <p className="text-3xl font-extrabold text-green">{formatFcfa(sale.priceFcfa)}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge {...status} />
          <span className="text-sm text-earth/60">📅 {sale.saleDate}</span>
        </div>
      </section>

      {/* Actions */}
      <SaleActions
        sellerPhone={sale.seller.phone}
        buyerPhone={sale.buyer.phone}
        animalId={sale.animalId}
        animalRegistered={Boolean(animal)}
        isTransferred={isTransferred}
      />

      {/* Seller & buyer */}
      <Panel icon="🤝" title="Vendeur & acheteur">
        <div className="space-y-3">
          <ContactButton contact={sale.seller} />
          <ContactButton contact={sale.buyer} />
        </div>
      </Panel>

      {/* Sale details */}
      <Panel icon="📋" title="Détails de la vente">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Marché" value={sale.market} />
          <Field label="Zone" value={sale.location} />
          <Field label="Statut transfert" value={status.label} />
          <div className="col-span-2 rounded-2xl bg-sand p-3 leading-tight">
            <dt className="text-xs font-semibold text-earth/50">Paiement</dt>
            <dd
              className={`mt-0.5 font-semibold ${
                isAlert ? "text-alert" : "text-earth"
              }`}
            >
              {sale.paymentStatus}
            </dd>
          </div>
        </dl>
      </Panel>

      {/* Ownership transfer timeline */}
      <Panel icon="🔄" title="Transfert de propriété">
        <ol className="relative space-y-4 border-l-2 border-sand-dark pl-5">
          {sale.timeline.map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute -left-[27px] flex h-8 w-8 items-center justify-center rounded-full bg-sand text-base shadow-card">
                {event.icon}
              </span>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-earth">{event.label}</div>
                <div className="text-xs text-earth/50">{event.time}</div>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      {/* Documents placeholder */}
      <Panel icon="📎" title="Documents">
        <div className="flex flex-wrap gap-2">
          {(sale.documents ?? [
            "Reçu de vente",
            "Certificat de propriété",
            "Pièce d'identité acheteur",
          ]).map((doc) => (
            <span
              key={doc}
              className="flex items-center gap-2 rounded-2xl bg-sand px-3 py-2 text-sm font-medium text-earth/60"
            >
              📄 {doc}
            </span>
          ))}
        </div>
        <p className="mt-3 rounded-full bg-gold/15 px-4 py-1.5 text-center text-xs font-medium text-gold-dark">
          🛠️ Pièces jointes bientôt disponibles
        </p>
      </Panel>
    </div>
  );
}
