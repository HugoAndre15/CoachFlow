/** The compact preparation sheet never changes an existing player's availability. */
export const positions = {
  GOALKEEPER: "Gardien",
  DEFENDER: "Défenseur",
  MIDFIELDER: "Milieu",
  FORWARD: "Attaquant",
};
export function preparationSheet(state) {
  return state.players.map((player) => {
    const entry = state.sheet.find((p) => p.player_id === player.id);
    return {
      player_id: player.id,
      presence:
        entry?.presence === "UNKNOWN" ? "ABSENT" : entry?.presence || "ABSENT",
      status: entry?.presence === "PRESENT" ? entry.status : "SUBSTITUTE",
    };
  });
}
export function setSelection(state, id, choice) {
  const player = state.players.find((p) => p.id === id);
  if (!player) throw new Error("Joueur introuvable.");
  if (["PRESENT", "STARTER", "SUBSTITUTE"].includes(choice) && !player.eligible)
    throw new Error(
      "Ce joueur n’est pas disponible. Vérifiez sa fiche en ligne.",
    );
  const sheet = preparationSheet(state);
  const entry = sheet.find((p) => p.player_id === id);
  const others = sheet.filter(
    (p) =>
      p.player_id !== id && p.presence === "PRESENT" && p.status === "STARTER",
  );
  if (choice === "PRESENT") {
    entry.presence = "PRESENT";
    entry.status = others.length < 11 ? "STARTER" : "SUBSTITUTE";
  } else if (choice === "STARTER" || choice === "SUBSTITUTE") {
    entry.presence = "PRESENT";
    entry.status = choice;
    // Promote explicitly without ever fielding twelve starters.
    if (choice === "STARTER" && others.length >= 11)
      others.at(-1).status = "SUBSTITUTE";
  } else if (["ABSENT", "UNCERTAIN"].includes(choice)) {
    entry.presence = choice;
    entry.status = "SUBSTITUTE";
  } else throw new Error("Statut invalide.");
  return sheet;
}
export function preparationSummary(state) {
  const sheet = preparationSheet(state);
  const present = sheet.filter((p) => p.presence === "PRESENT");
  const starters = present.filter((p) => p.status === "STARTER");
  const counts = {};
  for (const entry of starters) {
    const position = state.players.find(
      (p) => p.id === entry.player_id,
    )?.position;
    counts[position] = (counts[position] || 0) + 1;
  }
  const warnings = [];
  if (starters.length) {
    if (!counts.GOALKEEPER)
      warnings.push("Aucun gardien parmi les titulaires.");
    if (counts.GOALKEEPER > 1)
      warnings.push("Plusieurs gardiens parmi les titulaires.");
    for (const [position, label] of [
      ["DEFENDER", "défenseur"],
      ["MIDFIELDER", "milieu"],
      ["FORWARD", "attaquant"],
    ])
      if (!counts[position])
        warnings.push(`Aucun ${label} parmi les titulaires.`);
    if (counts.undefined || counts.null)
      warnings.push(
        "Certains postes ne sont pas renseignés : vérification incomplète.",
      );
  }
  const uncertain = sheet.filter((p) => p.presence === "UNCERTAIN").length;
  const canStart = present.length >= 11 && starters.length >= 2 && !uncertain;
  const reason =
    present.length < 11
      ? `Sélectionnez encore ${11 - present.length} joueur${11 - present.length > 1 ? "s" : ""} : 11 présents minimum.`
      : uncertain
        ? "Confirmez les présences incertaines avant de démarrer."
        : starters.length < 2
          ? "Choisissez au moins deux titulaires présents."
          : "";
  return {
    sheet,
    present: present.length,
    starters: starters.length,
    substitutes: present.length - starters.length,
    warnings,
    canStart,
    reason,
  };
}
