import { EmptyState } from "@/components/common/EmptyState";

export default function ReportsPage() {
  return (
    <EmptyState
      icon="📊"
      title="Résultats"
      message="Consultez les indicateurs clés de votre troupeau : santé, croissance, reproduction et revenus."
      hint="Bientôt disponible — Phase 2"
    />
  );
}
