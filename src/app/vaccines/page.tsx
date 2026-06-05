import { EmptyState } from "@/components/common/EmptyState";

export default function VaccinesPage() {
  return (
    <EmptyState
      icon="🧪"
      title="Vaccins"
      message="Planifiez et enregistrez les campagnes de vaccination (PPCB, fièvre aphteuse, etc.)."
      hint="Bientôt disponible — Phase 2"
    />
  );
}
