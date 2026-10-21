import { read, write, remove, all, lock } from "./store.js";
import { apply, command, lineup } from "./model.js";
const app = document.querySelector("#app");
const error = document.querySelector("#error");
const notice = document.querySelector("#notice");
const owner = JSON.parse(localStorage.getItem("user") || "null")?.id;
const matchId = new URLSearchParams(location.hash.slice(1)).get("match");
const key = owner + ":" + matchId;
let record,
  config,
  ready = false,
  busy = false,
  timer,
  noticeTimer;
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const name = (state, id) => {
  const p = state.players.find((p) => p.id === id);
  return p ? `${p.first_name} ${p.last_name}` : "Joueur";
};
const labels = {
  GOAL: "But",
  ASSIST: "Passe décisive",
  SUBSTITUTION: "Remplacement",
  YELLOW_CARD: "Carton jaune",
  RED_CARD: "Carton rouge",
  RECOVERY: "Récupération",
  BALL_LOSS: "Perte de balle",
};
function notify(text) {
  notice.textContent = text;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => (notice.textContent = ""), 5000);
}
function fail(e) {
  error.textContent =
    e.message ||
    "Une erreur est survenue. Vos données locales sont conservées.";
  error.hidden = false;
}
function assertOwner() {
  if (JSON.parse(localStorage.getItem("user") || "null")?.id !== owner)
    throw new Error(
      "Le compte a changé. Fermez cette page puis reconnectez-vous au compte du match.",
    );
}
async function request(path, body) {
  assertOwner();
  const token = localStorage.getItem("token");
  if (!token)
    throw new Error(
      "Reconnectez-vous au même compte pour synchroniser. Vos actions restent sur cet appareil.",
    );
  const response = await fetch(config.api + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401)
      throw new Error(
        "Session expirée. Reconnectez-vous au même compte depuis l’application puis revenez ici. Vos actions sont conservées.",
      );
    const e = new Error(
      Array.isArray(data.message)
        ? data.message.join(" ")
        : data.message ||
            "Synchronisation impossible. Réessayez sans effacer le match.",
    );
    e.status = response.status;
    throw e;
  }
  return data;
}
async function run(action, preserveDraft = false) {
  if (busy) return;
  busy = true;
  error.hidden = true;
  // Keep text inputs and keyboard focus in place until the action succeeds.
  app.querySelectorAll("button").forEach((b) => (b.disabled = true));
  const form = app.querySelector("form");
  let draft = form ? Object.fromEntries(new FormData(form)) : null;
  const focusedName = document.activeElement?.name;
  app.querySelectorAll("#sheet select").forEach((s) => (s.disabled = true));
  let failed = false;
  try {
    await action();
  } catch (e) {
    failed = true;
    fail(e);
  } finally {
    if (preserveDraft && form?.isConnected)
      draft = Object.fromEntries(new FormData(form));
    busy = false;
    await render();
    if ((failed || preserveDraft) && draft) {
      const next = app.querySelector("form");
      if (next) {
        next.elements.type.value = draft.type;
        next.elements.type.dispatchEvent(new Event("change"));
        for (const [name, value] of Object.entries(draft))
          if (next.elements[name]) next.elements[name].value = value;
        if (focusedName && next.elements[focusedName])
          next.elements[focusedName].focus();
      }
    }
  }
}
async function append(commands, clock) {
  await lock(key, async () => {
    assertOwner();
    const latest = await read(key);
    if (
      latest &&
      (latest.snapshot.version !== record.snapshot.version ||
        latest.commands.at(-1)?.id !== record.commands.at(-1)?.id)
    )
      throw new Error(
        "Le match a changé dans un autre onglet. La vue vient d’être actualisée, réessayez.",
      );
    if (!latest) throw new Error("Préparez d’abord ce match sur cet appareil.");
    if (latest.commands.length + commands.length > 450)
      throw new Error("Synchronisez les actions avant de poursuivre.");
    const previous =
      commands.length === 1 &&
      commands[0].kind === "sheet" &&
      latest.commands.at(-1)?.kind === "sheet" &&
      latest.commands.length > (latest.inflight?.commands.length || 0)
        ? latest.commands.slice(0, -1)
        : latest.commands;
    const next = {
      ...latest,
      commands: [...previous, ...commands],
      ...(clock ? { clock } : {}),
    };
    apply(next.snapshot, next.commands);
    assertOwner();
    await write(next);
    record = next;
  });
  notify("Enregistré sur cet appareil");
  scheduleSync();
}
function scheduleSync() {
  clearTimeout(timer);
  if (navigator.onLine && record?.commands.length && !record.blocked)
    timer = setTimeout(() => run(sync, true), 2000);
}
async function sync() {
  if (!navigator.onLine)
    throw new Error(
      "Vous êtes hors ligne. Vos actions restent enregistrées sur cet appareil.",
    );
  await lock(key, async () => {
    assertOwner();
    let latest = await read(key);
    if (!latest?.commands.length) return;
    if (!latest.inflight) {
      latest.inflight = {
        batchId: crypto.randomUUID(),
        version: latest.snapshot.version,
        commands: structuredClone(latest.commands),
      };
      await write(latest); // Durable before sending, including across a lost response or closed tab.
    }
    try {
      const snapshot = await request(
        `/matches/${matchId}/offline/sync`,
        latest.inflight,
      );
      assertOwner();
      const remaining = latest.commands
        .slice(latest.inflight.commands.length)
        .map((c) => ({
          ...c,
          data: {
            ...c.data,
            ...(c.data.id
              ? { id: snapshot.idMap?.[c.data.id] ?? c.data.id }
              : {}),
            ...(c.data.related_event_id
              ? {
                  related_event_id:
                    snapshot.idMap?.[c.data.related_event_id] ??
                    c.data.related_event_id,
                }
              : {}),
          },
        }));
      const next = {
        ...latest,
        snapshot,
        commands: remaining,
        inflight: null,
        blocked: false,
        lastError: null,
        syncedAt: Date.now(),
      };
      apply(snapshot, remaining);
      await write(next);
      record = next;
      notify(
        remaining.length
          ? "Premier envoi confirmé"
          : "Tout est enregistré sur CoachFlow",
      );
    } catch (e) {
      if ([400, 403, 404, 409].includes(e.status)) {
        latest.blocked = true;
        // Server validation may mention a changed medical availability. Do not
        // persist that detail in the offline copy.
        latest.lastError = e.status === 400
          ? 'Une action ne peut plus être appliquée. Vérifiez la feuille de match en ligne ; vos saisies sont conservées.'
          : e.message;
        await write(latest);
      }
      record = latest;
      throw e;
    }
  });
  scheduleSync();
}
async function prepare() {
  if (!ready)
    throw new Error(
      "Les fichiers hors ligne ne sont pas encore prêts. Vérifiez la connexion et rechargez cette page.",
    );
  await lock(key, async () => {
    assertOwner();
    const previous = await read(key);
    if (previous?.commands.length)
      throw new Error(
        "Synchronisez les actions locales avant de préparer à nouveau ce match.",
      );
    const snapshot = await request(`/matches/${matchId}/offline`);
    record = {
      key,
      owner,
      snapshot,
      commands: [],
      inflight: null,
      preparedAt: Date.now(),
      syncedAt: Date.now(),
      clock: previous?.clock || { elapsed: 0, startedAt: null },
    };
    await write(record);
  });
  const persisted = await navigator.storage?.persist?.().catch(() => false);
  notify(
    persisted
      ? "Prêt hors ligne sur cet appareil"
      : "Prêt hors ligne. Pensez à synchroniser après le match.",
  );
}
function options(values, selected) {
  return values
    .map(
      ([value, label]) =>
        `<option value="${escape(value)}" ${value === selected ? "selected" : ""}>${escape(label)}</option>`,
    )
    .join("");
}
function playerOptions(s, filter, selected = "") {
  return options(
    [
      ["", "Choisir un joueur"],
      ...s.players
        .filter(filter)
        .map((p) => [
          p.id,
          `${p.jersey_number ? p.jersey_number + " · " : ""}${p.first_name} ${p.last_name}`,
        ]),
    ],
    selected,
  );
}
function minutes() {
  return Math.min(120, Math.floor(elapsed() / 60000));
}
function elapsed() {
  return (
    (record?.clock?.elapsed || 0) +
    (record?.clock?.startedAt
      ? Math.max(0, Date.now() - record.clock.startedAt)
      : 0)
  );
}
async function render() {
  document.querySelector("#network").textContent = navigator.onLine
    ? "Réseau disponible"
    : "Hors ligne";
  if (busy) return;
  app.setAttribute("aria-busy", "false");
  if (!owner || !localStorage.getItem("token")) {
    app.innerHTML =
      '<section class="hero"><p class="eyebrow">Votre carnet de match</p><h1>Connectez-vous avant de partir.</h1><p>Préparez votre match avec du réseau, puis retrouvez-le ici sur le même appareil.</p><a class="button primary" href="/login">Se connecter</a></section>';
    return;
  }
  assertOwner();
  if (!matchId) {
    const records = (await all()).filter((r) => r.owner === owner);
    app.innerHTML = `<section class="hero"><p class="eyebrow">Au bord du terrain</p><h1>Vos matchs sur cet appareil</h1><p>Ouvrez ce carnet avant de passer en mode avion. Les données restent dans ce navigateur.</p></section>${records.map((r) => `<a class="panel" style="display:block" href="/terrain/index.html#match=${escape(r.snapshot.match.id)}"><h2>${escape(r.snapshot.match.team_name)} · ${escape(r.snapshot.match.opponent)}</h2><p>${r.commands.length ? r.commands.length + " actions à synchroniser" : "Prêt sur cet appareil"} →</p></a>`).join("") || '<p class="empty">Aucun match préparé. Depuis la fiche d’un match, choisissez « Ouvrir le mode terrain » avec du réseau.</p>'}<a class="button" href="/dashboard/matchs">Aller aux matchs</a>`;
    return;
  }
  record = await read(key);
  if (!record) {
    app.innerHTML = `<section class="hero"><p class="eyebrow">Préparer avant de partir</p><h1>Votre match, même sans réseau.</h1><p>Enregistrez la feuille de match sur cet appareil. Vous pourrez saisir les présences, le direct et la fin du match ici, puis synchroniser.</p></section><section class="panel"><h2>Un match · un appareil</h2><p class="muted">Utilisez ce carnet pendant le match. Évitez de modifier le même match sur un autre écran.</p><button class="primary" id="prepare" ${ready ? "" : "disabled"}>Préparer ce match hors ligne</button><p class="foot">Aucun détail de blessure ni coordonnée de joueur n’est enregistré. N’utilisez pas un appareil partagé. Effacer les données du navigateur supprime les actions non synchronisées.</p></section>`;
    document.querySelector("#prepare").onclick = () => run(prepare);
    return;
  }
  const s = apply(record.snapshot, record.commands),
    roles = lineup(s);
  const score =
    s.events.filter((e) => e.event_type === "GOAL").length +
    " – " +
    s.opponents.filter((e) => e.event_type === "GOAL").length;
  const upcoming = s.match.status === "UPCOMING",
    live = s.match.status === "LIVE";
  const pending = record.commands.length;
  app.innerHTML = `<section class="hero"><p class="eyebrow">${escape(s.match.team_name)} · ${upcoming ? "Préparation" : live ? "Match en cours" : "Match terminé"}</p><h1>${escape(s.match.opponent)}</h1><p>${escape(new Date(s.match.match_date).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }))} · ${s.match.location === "HOME" ? "Domicile" : "Extérieur"}</p>${!upcoming ? `<div class="score" aria-label="Score de notre équipe puis de l’adversaire">${score}</div>` : ""}<a href="/terrain/index.html">← Mes matchs sur cet appareil</a></section>
  <section class="panel sync" aria-label="État de sauvegarde"><div><strong>${pending ? pending + " actions à synchroniser" : "Prêt hors ligne · tout est enregistré"}</strong><p>${pending ? "Vos actions sont enregistrées sur cet appareil." : "Dernière synchronisation : " + new Date(record.syncedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p></div><button id="sync" ${!pending || !navigator.onLine ? "disabled" : ""}>Synchroniser</button></section>
  ${record.blocked ? '<p class="callout">' + escape(record.lastError || "") + "<br>" + "Synchronisation bloquée. Vos actions sont conservées. Exportez une copie avant toute résolution avec le coach ; ne supprimez pas ce match.</p>" : ""}
  ${
    upcoming
      ? `<section class="panel"><h2>Qui sera là ?</h2><p class="muted">Renseignez les présences et choisissez au moins deux titulaires.</p><div id="sheet">${s.players
          .map((p) => {
            const entry = s.sheet.find((e) => e.player_id === p.id) || {
              presence: "UNKNOWN",
              status: "SUBSTITUTE",
            };
            return `<div class="row player"><div><strong>${escape(p.first_name)} ${escape(p.last_name)}</strong><small>${p.jersey_number ? "N° " + p.jersey_number + " · " : ""}${p.eligible ? "Joueur de l’équipe" : "Non disponible à la préparation"}</small></div><label>Présence<select data-presence="${p.id}" aria-label="Présence de ${escape(p.first_name + " " + p.last_name)}">${options([["UNKNOWN", "À renseigner"], ...(p.eligible ? [["PRESENT", "Présent"]] : []), ["ABSENT", "Absent"], ["UNCERTAIN", "Incertain"]], entry.presence)}</select></label><label>Composition<select data-role="${p.id}" aria-label="Rôle de ${escape(p.first_name + " " + p.last_name)}" ${entry.presence !== "PRESENT" ? "disabled" : ""}>${options(
              [
                ["SUBSTITUTE", "Remplaçant"],
                ["STARTER", "Titulaire"],
              ],
              entry.status,
            )}</select></label></div>`;
          })
          .join(
            "",
          )}</div><div class="actions" style="margin-top:20px"><button class="primary" id="start">Démarrer le match</button></div></section>`
      : ""
  }
  ${
    live
      ? `<section class="panel clock"><output id="clock">00:00</output><button id="clock-toggle">${record.clock.startedAt ? "Pause chrono" : "Lancer le chrono"}</button><small>La minute reste modifiable pour chaque action.</small></section><div class="grid"><section class="panel"><h2>Noter une action</h2><form id="event"><div class="fields"><label>Action<select name="type" aria-label="Action" id="event-type">${options(
          [
            ["GOAL", "But marqué"],
            ["OPPONENT", "But encaissé"],
            ["SUBSTITUTION", "Remplacement"],
            ["YELLOW_CARD", "Carton jaune"],
            ["RED_CARD", "Carton rouge"],
            ["RECOVERY", "Récupération"],
            ["BALL_LOSS", "Perte de balle"],
          ],
          "GOAL",
        )}</select></label><label>Minute<input name="minute" aria-label="Minute" type="number" min="0" max="120" required value="${minutes()}"></label><label class="wide" id="player-label">Joueur<select name="player" aria-label="Joueur" required>${playerOptions(s, (p) => roles[p.id] && roles[p.id] !== "EXCLUDED")}</select></label><label class="wide" id="assist-label">Passe décisive (facultatif)<select name="assist" aria-label="Passe décisive (facultatif)">${playerOptions(s, (p) => roles[p.id] && roles[p.id] !== "EXCLUDED")}</select></label><label class="wide" id="incoming-label" hidden>Joueur entrant<select name="incoming" aria-label="Joueur entrant">${playerOptions(s, (p) => roles[p.id] === "SUBSTITUTE")}</select></label></div><details id="goal-details"><summary>Zone et partie du corps (facultatif)</summary><div class="fields"><label>Zone<select name="zone" aria-label="Zone">${options(
          [
            ["", "Non renseignée"],
            ["DEF_LEFT", "Défense gauche"],
            ["DEF_CENTER", "Défense centre"],
            ["DEF_RIGHT", "Défense droite"],
            ["MID_LEFT", "Milieu gauche"],
            ["MID_CENTER", "Milieu centre"],
            ["MID_RIGHT", "Milieu droite"],
            ["ATT_LEFT", "Attaque gauche"],
            ["ATT_CENTER", "Attaque centre"],
            ["ATT_RIGHT", "Attaque droite"],
            ["BOX", "Surface"],
            ["OUTSIDE", "Hors surface"],
          ],
          "",
        )}</select></label><label>Partie du corps<select name="body" aria-label="Partie du corps">${options(
          [
            ["", "Non renseignée"],
            ["LEFT_FOOT", "Pied gauche"],
            ["RIGHT_FOOT", "Pied droit"],
            ["HEAD", "Tête"],
          ],
          "",
        )}</select></label></div></details><button class="primary" type="submit">Enregistrer l’action</button></form></section><section class="panel"><h2>Sur le terrain</h2><ul>${s.players
          .filter((p) => roles[p.id] === "STARTER")
          .map(
            (p) =>
              `<li class="row">${escape(p.first_name + " " + p.last_name)}</li>`,
          )
          .join(
            "",
          )}</ul><button class="danger" style="margin-top:20px" id="finish">Terminer le match</button></section></div>`
      : ""
  }
  ${
    !upcoming
      ? `<section class="panel"><h2>Le fil du match</h2><ul>${
          [
            ...s.events.map((e) => ({ ...e, opponent: false })),
            ...s.opponents.map((e) => ({ ...e, opponent: true })),
          ]
            .sort((a, b) => b.minute - a.minute)
            .map(
              (e) =>
                `<li class="event"><span class="time">${e.minute}′</span><div><strong>${escape(e.opponent ? "Adversaire" : name(s, e.player_id))}</strong><small>${escape(labels[e.event_type] || e.event_type)}${e.related_player_id ? " → " + escape(name(s, e.related_player_id)) : ""}${e.body_part ? " · " + escape({ HEAD: "Tête", LEFT_FOOT: "Pied gauche", RIGHT_FOOT: "Pied droit" }[e.body_part]) : ""}</small></div>${!["SUBSTITUTION", "YELLOW_CARD", "RED_CARD"].includes(e.event_type) ? `<button data-delete="${escape(e.id)}" data-opponent="${e.opponent}" aria-label="Supprimer ${escape(labels[e.event_type] || e.event_type)} à ${e.minute} minutes">Retirer</button>` : ""}</li>`,
            )
            .join("") || '<li class="empty">Aucune action pour le moment.</li>'
        }</ul></section>`
      : ""
  }
  <details class="panel"><summary>Conservation et copie du match</summary><p class="muted">Cette copie reste dans ce navigateur. Synchronisez avant de changer d’appareil. Les corrections de cartons et remplacements se font en ligne après synchronisation.</p><div class="actions"><button id="export">Exporter une copie</button><button id="refresh" ${pending ? "disabled" : ""}>Actualiser depuis CoachFlow</button><button id="remove" ${pending ? "disabled" : ""}>Effacer la copie locale</button></div><p class="foot">L’export contient des noms et des présences. Conservez-le dans un endroit privé.</p></details><a class="button" href="/dashboard/matchs/${escape(matchId)}">Retour à la fiche en ligne</a>`;
  document.querySelector("#sync").onclick = () => run(sync, true);
  document.querySelector("#refresh").onclick = () => run(prepare);
  document.querySelector("#remove").onclick = () =>
    run(async () => {
      if (
        confirm(
          "Effacer cette copie locale ? Le match synchronisé reste sur CoachFlow.",
        )
      )
        await lock(key, async () => {
          const current = await read(key);
          if (current?.commands.length)
            throw new Error("Des actions restent à synchroniser.");
          await remove(key);
          record = null;
        });
    });
  document.querySelector("#export").onclick = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            snapshot: record.snapshot,
            commands: record.commands,
            clock: record.clock,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "coachflow-match-" + matchId + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  app.querySelectorAll("[data-delete]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          if (confirm("Retirer cette action ?"))
            await append([
              command(
                b.dataset.opponent === "true"
                  ? "deleteOpponent"
                  : "deleteEvent",
                { id: b.dataset.delete },
              ),
            ]);
        })),
  );
  if (upcoming) {
    app.querySelectorAll("[data-presence],[data-role]").forEach(
      (select) =>
        (select.onchange = () =>
          run(async () => {
            const players = s.players.map((p) => {
              const presence = document.querySelector(
                `[data-presence="${p.id}"]`,
              ).value;
              return {
                player_id: p.id,
                presence,
                status:
                  presence === "PRESENT"
                    ? document.querySelector(`[data-role="${p.id}"]`).value
                    : "SUBSTITUTE",
              };
            });
            // Unsent consecutive sheet edits collapse; an in-flight batch stays immutable.
            await append([command("sheet", { players })]);
          })),
    );
    document.querySelector("#start").onclick = () =>
      run(() =>
        append([command("status", { status: "LIVE" })], {
          elapsed: 0,
          startedAt: Date.now(),
        }),
      );
  }
  if (live) {
    document.querySelector("#clock-toggle").onclick = () =>
      run(async () => {
        await lock(key, async () => {
          const latest = await read(key);
          const c = latest.clock;
          latest.clock = c.startedAt
            ? {
                elapsed: c.elapsed + Math.max(0, Date.now() - c.startedAt),
                startedAt: null,
              }
            : { elapsed: c.elapsed, startedAt: Date.now() };
          await write(latest);
          record = latest;
        });
      });
    document.querySelector("#finish").onclick = () =>
      run(async () => {
        if (
          confirm(
            "Terminer ce match ? Vous pourrez synchroniser les actions dès le retour du réseau.",
          )
        )
          await append([command("status", { status: "FINISHED" })], {
            elapsed: elapsed(),
            startedAt: null,
          });
      });
    const form = document.querySelector("#event");
    document.querySelector("#event-type").onchange = () => {
      const type = form.elements.type.value,
        opponent = type === "OPPONENT",
        substitution = type === "SUBSTITUTION";
      document.querySelector("#player-label").hidden = opponent;
      form.elements.player.required = !opponent;
      document.querySelector("#assist-label").hidden = type !== "GOAL";
      document.querySelector("#incoming-label").hidden = !substitution;
      form.elements.incoming.required = substitution;
      document.querySelector("#goal-details").hidden = type !== "GOAL";
      form.elements.player.innerHTML = playerOptions(s, (p) =>
        substitution
          ? roles[p.id] === "STARTER"
          : roles[p.id] && roles[p.id] !== "EXCLUDED",
      );
    };
    form.onsubmit = (e) => {
      e.preventDefault();
      const data = new FormData(form);
      run(async () => {
        const type = data.get("type"),
          minute = Number(data.get("minute")),
          player = data.get("player");
        if (type === "OPPONENT")
          return append([command("opponent", { event_type: "GOAL", minute })]);
        if (type === "GOAL" && data.get("assist") === player)
          throw new Error("Le buteur et le passeur doivent être différents.");
        const event = command("event", {
          event_type: type,
          player_id: player,
          minute,
          ...(type === "SUBSTITUTION"
            ? { related_player_id: data.get("incoming") }
            : {}),
          ...(type === "GOAL" && data.get("zone")
            ? { zone: data.get("zone") }
            : {}),
          ...(type === "GOAL" && data.get("body")
            ? { body_part: data.get("body") }
            : {}),
        });
        const commands = [event];
        if (type === "GOAL" && data.get("assist"))
          commands.push(
            command("event", {
              event_type: "ASSIST",
              player_id: data.get("assist"),
              minute,
              related_event_id: event.id,
            }),
          );
        await append(commands);
      });
    };
    updateClock();
  }
}
function updateClock() {
  const output = document.querySelector("#clock");
  if (output) {
    const seconds = Math.floor(elapsed() / 1000);
    output.textContent =
      String(Math.floor(seconds / 60)).padStart(2, "0") +
      ":" +
      String(seconds % 60).padStart(2, "0");
  }
}
setInterval(updateClock, 1000);
function networkChanged() {
  document.querySelector("#network").textContent = navigator.onLine
    ? "Réseau disponible"
    : "Hors ligne";
  const button = document.querySelector("#sync");
  if (button) button.disabled = !navigator.onLine || !record?.commands.length;
}
addEventListener("online", () => {
  networkChanged();
  scheduleSync();
});
addEventListener("offline", networkChanged);
addEventListener("hashchange", () => location.reload());
addEventListener("storage", (e) => {
  if (["user", "token"].includes(e.key)) {
    if (JSON.parse(localStorage.getItem("user") || "null")?.id !== owner) {
      app.innerHTML =
        "<h1>Le compte a changé.</h1><p>Fermez cette page avant de continuer.</p>";
      clearTimeout(timer);
      record = null;
    }
  }
});
// Reload state after returning from another tab, without overwriting a form being edited.
addEventListener("focus", () => {
  if (!busy && !app.querySelector("form:focus-within")) render().catch(fail);
});
try {
  if (!("serviceWorker" in navigator) || !isSecureContext)
    throw new Error(
      "Le mode terrain nécessite HTTPS et un navigateur compatible.",
    );
  await navigator.serviceWorker.register("/terrain/sw.js", {
    scope: "/terrain/",
  });
  await Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "La préparation hors ligne a expiré. Rechargez avec une connexion stable.",
            ),
          ),
        20000,
      ),
    ),
  ]);
  config = await (await fetch("/api/terrain-config")).json();
  ready = true;
  await render();
  scheduleSync();
} catch (e) {
  fail(e);
  await render().catch(fail);
}
