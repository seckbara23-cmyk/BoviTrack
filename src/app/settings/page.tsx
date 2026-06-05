import { EmptyState } from "@/components/common/EmptyState";

export default function SettingsPage() {
  return (
    <EmptyState
      icon="⚙️"
      title="Réglages"
      message="Langue, notifications et préférences. L'assistance vocale (Wolof, Pulaar, Français) arrivera ici."
      hint="Bientôt disponible — Phase 2"
    />
  );
}
