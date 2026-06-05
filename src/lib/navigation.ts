export type NavItem = {
  href: string;
  label: string;
  /** Short label for tight spaces like the bottom bar */
  shortLabel: string;
  icon: string;
};

/**
 * Primary destinations. The first four (plus the central "Ajouter")
 * surface in the mobile bottom navigation; the full set appears in the
 * desktop sidebar. Labels are intentionally short — "Zéro lecture
 * obligatoire" means pictograms carry most of the meaning.
 */
export const primaryNav: NavItem[] = [
  { href: "/dashboard", label: "Accueil", shortLabel: "Accueil", icon: "🏠" },
  { href: "/herd", label: "Mon troupeau", shortLabel: "Troupeau", icon: "🐄" },
  { href: "/care", label: "Soins", shortLabel: "Soins", icon: "💉" },
  { href: "/vaccines", label: "Vaccins", shortLabel: "Vaccins", icon: "🧪" },
  { href: "/births", label: "Naissances", shortLabel: "Naissances", icon: "👶" },
  { href: "/location", label: "Localisation", shortLabel: "Carte", icon: "📍" },
  { href: "/alerts", label: "Alertes", shortLabel: "Alertes", icon: "🚨" },
  { href: "/sales", label: "Ventes", shortLabel: "Ventes", icon: "💰" },
  { href: "/reports", label: "Résultats", shortLabel: "Résultats", icon: "📊" },
];

export const secondaryNav: NavItem[] = [
  { href: "/breeding", label: "Reproduction", shortLabel: "Repro", icon: "❤️" },
  { href: "/users", label: "Utilisateurs", shortLabel: "Users", icon: "👥" },
  { href: "/settings", label: "Réglages", shortLabel: "Réglages", icon: "⚙️" },
];

/** Items shown in the mobile bottom bar (the center "+" is rendered separately). */
export const bottomNav: NavItem[] = [
  { href: "/dashboard", label: "Accueil", shortLabel: "Accueil", icon: "🏠" },
  { href: "/herd", label: "Troupeau", shortLabel: "Troupeau", icon: "🐄" },
  { href: "/alerts", label: "Alertes", shortLabel: "Alertes", icon: "🚨" },
  { href: "/reports", label: "Résultats", shortLabel: "Résultats", icon: "📊" },
];
