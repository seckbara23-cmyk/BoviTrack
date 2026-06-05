import { EmptyState } from "@/components/common/EmptyState";

export default function LocationPage() {
  return (
    <EmptyState
      icon="📍"
      title="Localisation"
      message="Visualisez la position de vos animaux et leurs parcours de transhumance sur la carte."
      hint="Bientôt disponible — Phase 2"
    />
  );
}
