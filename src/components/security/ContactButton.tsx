import type { Contact } from "@/lib/mock-data";

const roleEmoji: Record<Contact["role"], string> = {
  Propriétaire: "🧑‍🌾",
  Berger: "👨‍🌾",
  Vétérinaire: "🩺",
  Agent: "🧑‍💼",
};

/**
 * Contact row with a one-tap call action (tel: link). SMS/WhatsApp are
 * future channels — only the phone call is wired in Phase 1.
 */
export function ContactButton({ contact }: { contact: Contact }) {
  const telHref = `tel:${contact.phone.replace(/\s+/g, "")}`;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-sand p-3">
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl shadow-card"
        aria-hidden
      >
        {roleEmoji[contact.role]}
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-sm font-bold text-earth">
          {contact.name}
        </div>
        <div className="text-xs text-earth/60">{contact.role}</div>
        <div className="font-mono text-xs text-earth/50">{contact.phone}</div>
      </div>
      <a
        href={telHref}
        aria-label={`Appeler ${contact.name}`}
        className="tile-press flex h-12 w-12 items-center justify-center rounded-2xl bg-green text-2xl text-white shadow-tile hover:bg-green-dark"
      >
        📞
      </a>
    </div>
  );
}
