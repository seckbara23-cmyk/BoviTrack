import { EmptyState } from "@/components/common/EmptyState";

export default function CarePage() {
  return (
    <EmptyState
      icon="💉"
      title="Soins"
      message="Suivez les traitements, déparasitages et soins vétérinaires de votre troupeau."
      hint="Bientôt disponible — Phase 2"
    />
  );
}
