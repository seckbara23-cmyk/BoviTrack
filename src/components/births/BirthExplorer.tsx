"use client";

import { useMemo, useState } from "react";
import type { BirthRecord, BirthStatus, Location } from "@/lib/mock-data";
import { locations, birthStatusMeta } from "@/lib/mock-data";
import { NoResults } from "@/components/common/NoResults";
import { BirthCard } from "./BirthCard";

type StatusFilter = BirthStatus | "tous";

/**
 * Client search + filtering over birth records.
 * Search matches calf ID/name, mother ID/name, owner, and location.
 * Filters: status, location.
 */
export function BirthExplorer({ records }: { records: BirthRecord[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("tous");
  const [location, setLocation] = useState<Location | "tous">("tous");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      const matchesQuery =
        q === "" ||
        (r.calfId ?? "").toLowerCase().includes(q) ||
        (r.calfName ?? "").toLowerCase().includes(q) ||
        r.motherId.toLowerCase().includes(q) ||
        r.motherName.toLowerCase().includes(q) ||
        r.ownerName.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q);

      const matchesStatus = status === "tous" || r.status === status;
      const matchesLocation = location === "tous" || r.location === location;

      return matchesQuery && matchesStatus && matchesLocation;
    });
  }, [records, query, status, location]);

  const statusChips: { value: StatusFilter; label: string; emoji: string }[] = [
    { value: "tous", label: "Tous", emoji: "👶" },
    { value: "a_enregistrer", label: birthStatusMeta.a_enregistrer.label, emoji: birthStatusMeta.a_enregistrer.emoji },
    { value: "enregistre", label: birthStatusMeta.enregistre.label, emoji: birthStatusMeta.enregistre.emoji },
    { value: "suivi_requis", label: birthStatusMeta.suivi_requis.label, emoji: birthStatusMeta.suivi_requis.emoji },
    { value: "mort_ne", label: birthStatusMeta.mort_ne.label, emoji: birthStatusMeta.mort_ne.emoji },
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
          placeholder="Rechercher : veau, mère, propriétaire, zone…"
          aria-label="Rechercher une naissance"
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
        {results.length} naissance{results.length > 1 ? "s" : ""} affichée
        {results.length > 1 ? "s" : ""}
      </p>

      {results.length === 0 ? (
        <NoResults icon="👶" title="Aucune naissance trouvée" />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {results.map((record) => (
            <BirthCard key={record.id} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}
