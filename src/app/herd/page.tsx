import Link from "next/link";
import { AnimalCard } from "@/components/herd/AnimalCard";
import { animals } from "@/lib/mock-data";

export default function HerdPage() {
  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-earth">
            <span aria-hidden>🐄</span> Mon troupeau
          </h1>
          <p className="text-sm text-earth/60">
            {animals.length} animaux affichés (données fictives)
          </p>
        </div>
        <Link
          href="/herd/new"
          aria-label="Ajouter un animal"
          className="tile-press flex h-12 w-12 items-center justify-center rounded-2xl bg-gold text-2xl text-earth shadow-tile hover:bg-gold-dark hover:text-white"
        >
          ➕
        </Link>
      </header>

      <div className="grid gap-3 lg:grid-cols-2">
        {animals.map((animal) => (
          <AnimalCard key={animal.id} animal={animal} />
        ))}
      </div>
    </div>
  );
}
