import { EmptyState } from "@/components/common/EmptyState";

export default function UsersPage() {
  return (
    <EmptyState
      icon="👥"
      title="Utilisateurs"
      message="Gérez les éleveurs, bergers, agents de terrain et vétérinaires de votre exploitation."
      hint="Bientôt disponible — Phase 2"
    />
  );
}
