export const command = (kind, data) => ({
  id: crypto.randomUUID(),
  kind,
  data,
});
export function lineup(state) {
  const roles = Object.fromEntries(
    state.sheet
      .filter((p) => p.presence === "PRESENT")
      .map((p) => [p.player_id, p.status]),
  );
  for (const e of state.events) {
    if (e.event_type === "SUBSTITUTION") {
      roles[e.player_id] = "SUBSTITUTE";
      roles[e.related_player_id] = "STARTER";
    }
    if (e.event_type === "RED_CARD") roles[e.player_id] = "EXCLUDED";
  }
  return roles;
}
export function apply(snapshot, commands) {
  const s = structuredClone(snapshot);
  for (const c of commands) {
    const d = c.data;
    if (c.kind === "sheet") {
      if (s.match.status !== "UPCOMING")
        throw new Error("Les présences sont figées après le début du match.");
      s.sheet = d.players;
    } else if (c.kind === "status") {
      if (d.status === "LIVE") {
        if (s.match.status !== "UPCOMING")
          throw new Error("Ce match a déjà démarré.");
        if (
          s.sheet.some(
            (p) => p.presence === "UNKNOWN" || p.presence === "UNCERTAIN",
          )
        )
          throw new Error("Renseignez toutes les présences avant de démarrer.");
        if (
          s.sheet.filter(
            (p) => p.presence === "PRESENT" && p.status === "STARTER",
          ).length < 2
        )
          throw new Error("Choisissez au moins deux titulaires présents.");
      } else if (d.status !== "FINISHED" || s.match.status !== "LIVE")
        throw new Error("Transition de match invalide.");
      s.match.status = d.status;
    } else if (c.kind === "event" || c.kind === "opponent") {
      if (s.match.status !== "LIVE")
        throw new Error("Démarrez le match pour saisir une action.");
      if (!Number.isInteger(d.minute) || d.minute < 0 || d.minute > 120)
        throw new Error("La minute doit être comprise entre 0 et 120.");
      if (c.kind === "event") {
        const roles = lineup(s);
        if (!roles[d.player_id] || roles[d.player_id] === "EXCLUDED")
          throw new Error("Choisissez un joueur présent et non exclu.");
        if (d.event_type === "SUBSTITUTION") {
          if (
            roles[d.player_id] !== "STARTER" ||
            roles[d.related_player_id] !== "SUBSTITUTE"
          )
            throw new Error("Choisissez un titulaire et un remplaçant.");
          if (
            s.events.some(
              (e) => e.event_type === "SUBSTITUTION" && e.minute > d.minute,
            )
          )
            throw new Error("La minute précède le dernier remplacement.");
        }
        s.events.push({ ...d, id: c.id });
        if (
          d.event_type === "YELLOW_CARD" &&
          s.events.filter(
            (e) =>
              e.player_id === d.player_id && e.event_type === "YELLOW_CARD",
          ).length >= 2
        )
          s.events.push({
            id: c.id + "-red",
            player_id: d.player_id,
            event_type: "RED_CARD",
            minute: d.minute,
            automatic: true,
          });
      } else s.opponents.push({ ...d, id: c.id });
    } else if (c.kind === "deleteEvent") {
      const target = s.events.find((e) => e.id === d.id);
      if (
        target?.event_type === "SUBSTITUTION" ||
        target?.event_type === "YELLOW_CARD" ||
        target?.event_type === "RED_CARD"
      )
        throw new Error(
          "Les corrections de cartons et remplacements se font en ligne après synchronisation.",
        );
      s.events = s.events.filter(
        (e) => e.id !== d.id && e.related_event_id !== d.id,
      );
    } else if (c.kind === "deleteOpponent")
      s.opponents = s.opponents.filter((e) => e.id !== d.id);
  }
  return s;
}
