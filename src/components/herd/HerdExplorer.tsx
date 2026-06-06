"use client";

import { useMemo, useState } from "react";
import type { Animal, Breed, Location, SecurityStatus } from "@/lib/mock-data";
import { breeds, locations, securityStatusMeta } from "@/lib/mock-data";
import { AnimalCard } from "./AnimalCard";

type SecurityFilter = SecurityStatus | "tous";

/**
 * Client-side search + filtering over the herd registry.
 * Search matches animal ID, RFID, owner, and location. Filters cover
 * breed, security status, and location. Icon-first, large tap targets.
 */
export function HerdExplorer({ animals }: { animals: Animal[] }) {
  const [query, setQuery] = useState("");
  const [security, setSecurity] = useState<SecurityFilter>("tous");
  const [breed, setBreed] = useState<Breed | "tous">("tous");
  const [location, setLocation] = useState<Location | "tous">("tous");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return animals.filter((a) => {
      const matchesQuery =
        q === "" ||
        a.id.toLowerCase().includes(q) ||
        a.identity.rfid.toLowerCase().includes(q) ||
        a.ownership.owner.name.toLowerCase().includes(q) ||
        a.ownership.location.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q);

      const matchesSecurity =
        security === "tous" || a.security.status === security;
      const matchesBreed = breed === "tous" || a.identity.breed === breed;
      const matchesLocation =
        location === "tous" || a.ownership.location === location;

      return matchesQuery && matchesSecurity && matchesBreed && matchesLocation;
    });
  }, [animals, query, security, breed, location]);

  const securityChips: { value: SecurityFilter; label: string; emoji: string }[] =
    [
      { value: "tous", label: "Tous", emoji: "🐄" },
      { value: "securise", label: securityStatusMeta.securise.label, emoji: "🟢" },
      { value: "alerte", label: securityStatusMeta.alerte.label, emoji: "🔴" },
      { value: "surveillance", label: securityStatusMeta.surveillance.label, emoji: "🟡" },
    ];

  const selectClass =
    "rounded-2xl border-2 border-sand-dark bg-white px-3 py-2.5 text-sm font-semibold text-earth shadow-card focus:border-green focus:outline-none";

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl">
          🔍
        </span>
        <input
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher : ID, RFID, propriétaire, zone…"
          aria-label="Rechercher un animal"
          className="w-full rounded-2xl border-2 border-sand-dark bg-white py-3.5 pl-12 pr-4 text-base text-earth shadow-card placeholder:text-earth/40 focus:border-green focus:outline-none"
        />
      </div>

      {/* Security status chips */}
      <div className="flex flex-wrap gap-2">
        {securityChips.map((chip) => {
          const active = security === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => setSecurity(chip.value)}
              className={`tile-press flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-card transition-colors ${
                active
                  ? "bg-green text-white"
                  : "bg-white text-earth/70 hover:bg-green-50"
              }`}
            >
              <span aria-hidden>{chip.emoji}</span>
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Breed + location selects */}
      <div className="flex flex-wrap gap-2">
        <select
          value={breed}
          onChange={(e) => setBreed(e.target.value as Breed | "tous")}
          aria-label="Filtrer par race"
          className={selectClass}
        >
          <option value="tous">🧬 Toutes les races</option>
          {breeds.map((b) => (
            <option key={b} value={b}>
              {b}
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

      {/* Results */}
      <p className="text-sm font-medium text-earth/60">
        {results.length} animal{results.length > 1 ? "aux" : ""} affiché
        {results.length > 1 ? "s" : ""}
      </p>

      {results.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-card">
          <span className="text-5xl" aria-hidden>
            🔍
          </span>
          <p className="mt-3 font-semibold text-earth">Aucun animal trouvé</p>
          <p className="text-sm text-earth/60">
            Modifiez la recherche ou les filtres.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {results.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      )}
    </div>
  );
}
