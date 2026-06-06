"use client";

import { useMemo, useState } from "react";
import type { Animal, CareRecord, CareStatus } from "@/lib/mock-data";
import { careStatusMeta } from "@/lib/mock-data";
import { NoResults } from "@/components/common/NoResults";
import { CareCard } from "./CareCard";

type StatusFilter = CareStatus | "tous";

/**
 * Client search + filtering over care records.
 * Search matches animal ID, owner, diagnosis/reason, and vet.
 * Filters: status, animal, vet.
 */
export function CareExplorer({
  records,
  animals,
}: {
  records: CareRecord[];
  animals: Animal[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("tous");
  const [animalId, setAnimalId] = useState("tous");
  const [vet, setVet] = useState("tous");

  const vets = useMemo(
    () => Array.from(new Set(records.map((r) => r.vet.name))),
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
        r.reason.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.vet.name.toLowerCase().includes(q) ||
        owner.toLowerCase().includes(q);

      const matchesStatus = status === "tous" || r.status === status;
      const matchesAnimal = animalId === "tous" || r.animalId === animalId;
      const matchesVet = vet === "tous" || r.vet.name === vet;

      return matchesQuery && matchesStatus && matchesAnimal && matchesVet;
    });
  }, [records, ownerById, query, status, animalId, vet]);

  const statusChips: { value: StatusFilter; label: string; emoji: string }[] = [
    { value: "tous", label: "Tous", emoji: "💉" },
    { value: "urgent", label: careStatusMeta.urgent.label, emoji: careStatusMeta.urgent.emoji },
    { value: "en_cours", label: careStatusMeta.en_cours.label, emoji: careStatusMeta.en_cours.emoji },
    { value: "suivi", label: careStatusMeta.suivi.label, emoji: careStatusMeta.suivi.emoji },
    { value: "a_faire", label: careStatusMeta.a_faire.label, emoji: careStatusMeta.a_faire.emoji },
    { value: "termine", label: careStatusMeta.termine.label, emoji: careStatusMeta.termine.emoji },
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
          placeholder="Rechercher : animal, propriétaire, diagnostic, vétérinaire…"
          aria-label="Rechercher un soin"
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
          value={animalId}
          onChange={(e) => setAnimalId(e.target.value)}
          aria-label="Filtrer par animal"
          className={selectClass}
        >
          <option value="tous">🐄 Tous les animaux</option>
          {animals.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} · {a.id}
            </option>
          ))}
        </select>

        <select
          value={vet}
          onChange={(e) => setVet(e.target.value)}
          aria-label="Filtrer par vétérinaire"
          className={selectClass}
        >
          <option value="tous">🩺 Tous les vétérinaires</option>
          {vets.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm font-medium text-earth/60">
        {results.length} soin{results.length > 1 ? "s" : ""} affiché
        {results.length > 1 ? "s" : ""}
      </p>

      {results.length === 0 ? (
        <NoResults icon="💉" title="Aucun soin trouvé" />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {results.map((care) => (
            <CareCard key={care.id} care={care} />
          ))}
        </div>
      )}
    </div>
  );
}
