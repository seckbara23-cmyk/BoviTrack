"use client";

import { useMemo, useState } from "react";
import type {
  Animal,
  Location,
  VaccineRecord,
  VaccineStatus,
} from "@/lib/mock-data";
import { locations, vaccineStatusMeta } from "@/lib/mock-data";
import { VaccineCard } from "./VaccineCard";

type StatusFilter = VaccineStatus | "tous";

/**
 * Client search + filtering over vaccine records.
 * Search matches animal ID, vaccine name, and owner.
 * Filters: status, vaccine type, location.
 */
export function VaccineExplorer({
  records,
  animals,
}: {
  records: VaccineRecord[];
  animals: Animal[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("tous");
  const [type, setType] = useState("tous");
  const [location, setLocation] = useState<Location | "tous">("tous");

  const types = useMemo(
    () => Array.from(new Set(records.map((r) => r.name))),
    [records],
  );

  const ownerById = useMemo(() => {
    const map = new Map<string, string>();
    animals.forEach((a) => map.set(a.id, a.ownership.owner.name));
    return map;
  }, [animals]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      const owner = ownerById.get(r.animalId) ?? "";
      const matchesQuery =
        q === "" ||
        r.animalId.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        owner.toLowerCase().includes(q);

      const matchesStatus = status === "tous" || r.status === status;
      const matchesType = type === "tous" || r.name === type;
      const matchesLocation = location === "tous" || r.location === location;

      return matchesQuery && matchesStatus && matchesType && matchesLocation;
    });
  }, [records, ownerById, query, status, type, location]);

  const statusChips: { value: StatusFilter; label: string; emoji: string }[] = [
    { value: "tous", label: "Tous", emoji: "💉" },
    { value: "en_retard", label: vaccineStatusMeta.en_retard.label, emoji: vaccineStatusMeta.en_retard.emoji },
    { value: "a_faire", label: vaccineStatusMeta.a_faire.label, emoji: vaccineStatusMeta.a_faire.emoji },
    { value: "programme", label: vaccineStatusMeta.programme.label, emoji: vaccineStatusMeta.programme.emoji },
    { value: "fait", label: vaccineStatusMeta.fait.label, emoji: vaccineStatusMeta.fait.emoji },
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
          placeholder="Rechercher : animal, vaccin, propriétaire…"
          aria-label="Rechercher un vaccin"
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
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Filtrer par type de vaccin"
          className={selectClass}
        >
          <option value="tous">🧪 Tous les vaccins</option>
          {types.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

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
        {results.length} vaccin{results.length > 1 ? "s" : ""} affiché
        {results.length > 1 ? "s" : ""}
      </p>

      {results.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-card">
          <span className="text-5xl" aria-hidden>
            🔍
          </span>
          <p className="mt-3 font-semibold text-earth">Aucun vaccin trouvé</p>
          <p className="text-sm text-earth/60">Modifiez la recherche ou les filtres.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {results.map((vaccine) => (
            <VaccineCard key={vaccine.id} vaccine={vaccine} />
          ))}
        </div>
      )}
    </div>
  );
}
