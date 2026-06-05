import { EmptyState } from "@/components/common/EmptyState";

export default function AddAnimalPage() {
  return (
    <EmptyState
      icon="➕"
      title="Ajouter un animal"
      message="Un formulaire simple et visuel permettra d'enregistrer un nouvel animal en quelques touches, avec assistance vocale."
      hint="Bientôt disponible — Phase 2"
    />
  );
}
