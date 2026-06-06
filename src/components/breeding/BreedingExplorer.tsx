"use client";

import { useMemo, useState } from "react";
import type { BreedingRecord, BreedingStatus, Location } from "@/lib/mock-data";
import { locations, breedingStatusMeta, getAnimalById } from "@/lib/mock-data";
import { NoResults } from "@/components/common/NoResults";
import { BreedingCard } from "./BreedingCard";

type StatusFilter = BreedingStatus | "tous";

/**
 * Client search + filtering over breeding records.
 * Search matches female ID/name, owner, location, and bull/father.
 * Filters: status, location.
 */
export function BreedingExplorer({ records }: { records: BreedingRecord[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("tous");
  const [location, setLocation] = useState<Location | "tous">("tous");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      const fatherName = r.fatherId ? getAnimalById(r.fatherId)?.name ?? "" : "";
      const father = `${fatherName} ${r.bullName ?? ""}`.toLowerCase();
      const matchesQuery =
        q === "" ||
        r.femaleId.toLowerCase().includes(q) ||
        r.femaleName.toLowerCase().includes(q) ||
        r.ownerName.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        father.includes(q);

      const matchesStatus = status === "tous" || r.status === status;
      const matchesLocation = location === "tous" || r.location === location;

      return matchesQuery && matchesStatus && matchesLocation;
    });
  }, [records, query, status, location]);

  const statusChips: { value: StatusFilter; label: string; emoji: string }[] = [
    { value: "tous", label: "Tous", emoji: "🐄" },
    { value: "gestation", label: breedingStatusMeta.gestation.label, emoji: breedingStatusMeta.gestation.emoji },
    { value: "mise_bas_proche", label: breedingStatusMeta.mise_bas_proche.label, emoji: breedingStatusMeta.mise_bas_proche.emoji },
    { value: "a_surveiller", label: breedingStatusMeta.a_surveiller.label, emoji: breedingStatusMeta.a_surveiller.emoji },
    { value: "a_confirmer", label: breedingStatusMeta.a_confirmer.label, emoji: breedingStatusMeta.a_confirmer.emoji },
    { value: "terminee", label: breedingStatusMeta.terminee.label, emoji: breedingStatusMeta.terminee.emoji },
    { value: "echec", label: breedingStatusMeta.echec.label, emoji: breedingStatusMeta.echec.emoji },
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
          placeholder="Rechercher : femelle, propriétaire, zone, taureau…"
          aria-label="Rechercher une reproduction"
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
        {results.length} reproduction{results.length > 1 ? "s" : ""} affichée
        {results.length > 1 ? "s" : ""}
      </p>

      {results.length === 0 ? (
        <NoResults icon="🐄🐂" title="Aucune reproduction trouvée" />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {results.map((record) => (
            <BreedingCard key={record.id} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}
