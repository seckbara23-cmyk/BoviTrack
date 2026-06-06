"use client";

import { useMemo, useState } from "react";
import type { SaleRecord, SaleStatus, Location } from "@/lib/mock-data";
import { locations, saleStatusMeta } from "@/lib/mock-data";
import { SaleCard } from "./SaleCard";

type StatusFilter = SaleStatus | "tous";

/**
 * Client search + filtering over sale records.
 * Search matches animal ID/name, seller, buyer, and market.
 * Filters: status, location.
 */
export function SalesExplorer({ records }: { records: SaleRecord[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("tous");
  const [location, setLocation] = useState<Location | "tous">("tous");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      const matchesQuery =
        q === "" ||
        r.animalId.toLowerCase().includes(q) ||
        r.animalName.toLowerCase().includes(q) ||
        r.seller.name.toLowerCase().includes(q) ||
        r.buyer.name.toLowerCase().includes(q) ||
        r.market.toLowerCase().includes(q);

      const matchesStatus = status === "tous" || r.status === status;
      const matchesLocation = location === "tous" || r.location === location;

      return matchesQuery && matchesStatus && matchesLocation;
    });
  }, [records, query, status, location]);

  const statusChips: { value: StatusFilter; label: string; emoji: string }[] = [
    { value: "tous", label: "Tous", emoji: "💰" },
    { value: "negociation", label: saleStatusMeta.negociation.label, emoji: saleStatusMeta.negociation.emoji },
    { value: "confirmee", label: saleStatusMeta.confirmee.label, emoji: saleStatusMeta.confirmee.emoji },
    { value: "paiement_attente", label: saleStatusMeta.paiement_attente.label, emoji: saleStatusMeta.paiement_attente.emoji },
    { value: "transfert_attente", label: saleStatusMeta.transfert_attente.label, emoji: saleStatusMeta.transfert_attente.emoji },
    { value: "transfere", label: saleStatusMeta.transfere.label, emoji: saleStatusMeta.transfere.emoji },
    { value: "annule", label: saleStatusMeta.annule.label, emoji: saleStatusMeta.annule.emoji },
  ];

  const selectClass =
    "rounded-2xl border-2 border-sand-dark bg-white px-3 py-2.5 text-sm font-semibold text-earth shadow-card focus:border-green focus:outline-none";

  return (
    <div className="space-y-4">
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl">
          🔍
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher : animal, vendeur, acheteur, marché…"
          aria-label="Rechercher une vente"
          className="w-full rounded-2xl border-2 border-sand-dark bg-white py-3.5 pl-12 pr-4 text-base text-earth shadow-card placeholder:text-earth/40 focus:border-green focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {statusChips.map((chip) => {
          const active = status === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => setStatus(chip.value)}
              className={`tile-press flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-card transition-colors ${
                active ? "bg-green text-white" : "bg-white text-earth/70 hover:bg-green-50"
              }`}
            >
              <span aria-hidden>{chip.emoji}</span>
              {chip.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value as Location | "tous")}
          aria-label="Filtrer par zone"
          className={selectClass}
        >
          <option value="tous">📍 Toutes les zones</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm font-medium text-earth/60">
        {results.length} vente{results.length > 1 ? "s" : ""} affichée
        {results.length > 1 ? "s" : ""}
      </p>

      {results.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-card">
          <span className="text-5xl" aria-hidden>
            🔍
          </span>
          <p className="mt-3 font-semibold text-earth">Aucune vente trouvée</p>
          <p className="text-sm text-earth/60">Modifiez la recherche ou les filtres.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {results.map((sale) => (
            <SaleCard key={sale.id} sale={sale} />
          ))}
        </div>
      )}
    </div>
  );
}
