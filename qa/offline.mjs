import assert from "node:assert/strict";
import fs from "node:fs";
import AxeBuilder from "@axe-core/playwright";
export default async function (q) {
  const previousTeam = q.team,
    previousPlayers = q.players;
  q.team = await q.call("POST", "/teams", {
    name: "Terrain QA",
    category: "Seniors",
    club_id: q.club.id,
  });
  q.players = {};
  for (const key of [
    "emile",
    "hugo",
    "noah",
    "adam",
    "matteo",
    "unknown",
    "long",
    "suspended",
  ]) {
    const p = previousPlayers[key];
    q.players[key] = await q.call("POST", "/players", {
      team_id: q.team.id,
      first_name: p.first_name,
      last_name: p.last_name,
      position: p.position,
      jersey_number: p.jersey_number,
      status: p.status,
    });
  }
  for (let i = 0; i < 9; i++) {
    q.players["extra" + i] = await q.call("POST", "/players", {
      team_id: q.team.id,
      first_name: "Joueur " + i,
      last_name: "Terrain",
      position: ["DEFENDER", "MIDFIELDER", "FORWARD"][i % 3],
      jersey_number: 20 + i,
      status: "ACTIVE",
    });
  }
  const make = () =>
    q.call("POST", "/matches", {
      team_id: q.team.id,
      opponent: "AS Terrain",
      location: "AWAY",
      match_date: new Date(Date.now() + 86400000).toISOString(),
    });
  const m = await make();
  const p = q.page;
  await p.setViewportSize({ width: 375, height: 812 });
  await p.goto(q.base + "/terrain/index.html#match=" + m.id);
  await p
    .getByRole("button", { name: "Préparer ce match hors ligne", exact: true })
    .click();
  await p
    .getByRole("heading", { name: "Qui sera là ?", exact: true })
    .waitFor();
  await p.waitForFunction(() => !!navigator.serviceWorker.controller);
  const stored = await p.evaluate(async () => {
    const { all } = await import("/terrain/store.js");
    return all();
  });
  assert.ok(
    !/INJURED|strong_foot|password|access_token|email/.test(
      JSON.stringify(stored),
    ),
    "Minimal private storage",
  );
  assert.ok(
    stored.some((r) =>
      r.snapshot.players.some((p) => p.position === "MIDFIELDER"),
    ),
    "Position in minimal snapshot",
  );
  await q.context.setOffline(true);
  assert.equal(
    await p.locator("#start").isDisabled(),
    true,
    "11 présents minimum",
  );
  for (const key of [
    "emile",
    "hugo",
    ...Array.from({ length: 9 }, (_, i) => "extra" + i),
    "noah",
  ]) {
    await p.locator('[data-pick="' + q.players[key].id + '"]').check();
    await p.waitForFunction(
      (id) => !document.querySelector('[data-pick="' + id + '"]').disabled,
      q.players[key].id,
    );
  }
  assert.equal(await p.locator("#sheet input:checked").count(), 12);
  assert.match(
    await p.locator(".roster-counts").innerText(),
    /11\/11 titulaires/,
  );
  assert.equal(
    (await p.locator("#status-" + q.players.noah.id).textContent()).replace(/\s/g, ""),
    "Remplaçant⌄",
  );
  // Quick status edits, deselection and reload must preserve the sheet offline.
  await p.locator("#status-" + q.players.noah.id).click();
  await p
    .locator('[data-choice="' + q.players.noah.id + '"]')
    .selectOption("UNCERTAIN");
  await p.waitForFunction(() => document.querySelector("#start").disabled);
  await p.locator("#status-" + q.players.noah.id).click();
  await p
    .locator('[data-choice="' + q.players.noah.id + '"]')
    .selectOption("SUBSTITUTE");
  await p.waitForFunction(() => !document.querySelector("#start").disabled);
  await p.reload();
  await p.locator("#sheet").waitFor();
  assert.equal(await p.locator("#sheet input:checked").count(), 12);
  assert.equal(
    (await p.locator("#status-" + q.players.noah.id).textContent()).replace(/\s/g, ""),
    "Remplaçant⌄",
  );
  assert.equal(
    await p
      .locator('[data-pick="' + q.players.suspended.id + '"]')
      .isDisabled(),
    true,
  );
  for (const width of [375, 768, 1280]) {
    await p.setViewportSize({ width, height: 900 });
    assert.equal(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    const audit = await new AxeBuilder({ page: p })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      audit.violations.map((v) => v.id),
      [],
      "Preparation accessibility " + width,
    );
    await p.screenshot({
      path: q.out + "/preparation-" + width + ".png",
      fullPage: true,
    });
  }
  await p
    .getByRole("button", { name: "Démarrer le match", exact: true })
    .click();
  await p
    .getByRole("heading", { name: "Noter une action", exact: true })
    .waitFor();
  await p.getByLabel("Minute", { exact: true }).fill("12");
  await p
    .getByLabel("Joueur", { exact: true })
    .selectOption(q.players.emile.id);
  await p
    .getByLabel("Passe décisive (facultatif)", { exact: true })
    .selectOption(q.players.hugo.id);
  await p
    .getByText("Zone et partie du corps (facultatif)", { exact: true })
    .click();
  await p.getByLabel("Zone", { exact: true }).selectOption("ATT_CENTER");
  await p.getByLabel("Partie du corps", { exact: true }).selectOption("HEAD");
  await p
    .getByRole("button", { name: "Enregistrer l’action", exact: true })
    .click();
  await p
    .getByLabel("Score de notre équipe puis de l’adversaire")
    .filter({ hasText: "1 – 0" })
    .waitFor();
  // Close/reopen the page while offline, not just a client-side navigation.
  await p.close();
  q.page = await q.context.newPage();
  const page = q.page;
  page.setDefaultTimeout(45000);
  page.on("pageerror", (e) => q.errors.push(e.message));
  await page.goto(q.base + "/terrain/index.html#match=" + m.id);
  await page
    .getByLabel("Score de notre équipe puis de l’adversaire")
    .filter({ hasText: "1 – 0" })
    .waitFor();
  await page.getByLabel("Action", { exact: true }).selectOption("SUBSTITUTION");
  await page.getByLabel("Minute", { exact: true }).fill("25");
  await page
    .getByLabel("Joueur", { exact: true })
    .selectOption(q.players.emile.id);
  await page
    .getByLabel("Joueur entrant", { exact: true })
    .selectOption(q.players.noah.id);
  await page
    .getByRole("button", { name: "Enregistrer l’action", exact: true })
    .click();
  await page
    .getByText("Remplacement → Noah Entrant", { exact: true })
    .waitFor();
  await page.getByLabel("Action", { exact: true }).selectOption("OPPONENT");
  await page.getByLabel("Minute", { exact: true }).fill("30");
  await page
    .getByRole("button", { name: "Enregistrer l’action", exact: true })
    .click();
  await page
    .getByLabel("Score de notre équipe puis de l’adversaire")
    .filter({ hasText: "1 – 1" })
    .waitFor();
  const audits = [];
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.screenshot({
      path: q.out + "/offline-" + width + ".png",
      fullPage: true,
    });
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    audits.push({ width, violations: result.violations });
  }
  fs.writeFileSync(
    q.out + "/offline-accessibility.json",
    JSON.stringify(audits, null, 2),
  );
  assert.deepEqual(
    audits.flatMap((a) =>
      a.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.failureSummary),
      })),
    ),
    [],
  );
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Terminer le match", exact: true })
    .click();
  await page.getByText(/Match terminé/).waitFor();
  const serverBefore = await q.call("GET", "/matches/" + m.id);
  assert.equal(serverBefore.status, "UPCOMING");
  assert.equal(serverBefore.matchEvents.length, 0);
  // An expired session must not erase the offline copy or redirect away from it.
  await page.evaluate(() =>
    localStorage.setItem("token", "expired-test-token"),
  );
  await q.context.setOffline(false);
  await page
    .locator("#error")
    .filter({ hasText: "Session expirée" })
    .waitFor({ state: "visible" });
  assert.ok(
    await page.evaluate(async () => {
      const { all } = await import("/terrain/store.js");
      return (await all()).some((r) => r.commands.length > 0);
    }),
  );
  await q.context.setOffline(true);
  await page.evaluate((token) => localStorage.setItem("token", token), q.token);
  // The server commits but its response is lost: retry must not duplicate any event.
  let sent;
  const sentPromise = new Promise((resolve) => (sent = resolve));
  const url = "**/matches/" + m.id + "/offline/sync";
  const lost = async (route) => {
    const response = await route.fetch();
    sent({ status: response.status(), body: await response.json() });
    await route.abort();
  };
  await page.route(url, lost);
  await q.context.setOffline(false);
  const first = await Promise.race([
    sentPromise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Sync request was not sent within 30s")),
        30000,
      ),
    ),
  ]);
  assert.equal(first.status, 201, JSON.stringify(first.body));
  await page.locator("#error").waitFor({ state: "visible" });
  await q.context.setOffline(true);
  page.once("dialog", (d) => d.accept());
  await page.locator('[data-opponent="true"]').click();
  await page
    .getByLabel("Score de notre équipe puis de l’adversaire")
    .filter({ hasText: "1 – 0" })
    .waitFor();
  await page.unroute(url, lost);
  await q.context.setOffline(false);
  await page.getByRole("button", { name: "Synchroniser", exact: true }).click();
  await page
    .getByText("Prêt hors ligne · tout est enregistré", { exact: true })
    .waitFor();
  const saved = await q.call("GET", "/matches/" + m.id);
  assert.equal(saved.status, "FINISHED");
  assert.equal(saved.matchEvents.length, 3);
  assert.equal(saved.opponentEvents.length, 0);
  const overview = await q.call(
    "GET",
    "/players/overview?teamId=" + q.team.id + "&period=ALL",
  );
  const scorer = overview.players.find((p) => p.id === q.players.emile.id),
    passer = overview.players.find((p) => p.id === q.players.hugo.id),
    sub = overview.players.find((p) => p.id === q.players.noah.id);
  assert.equal(scorer.stats.goals, 1);
  assert.equal(passer.stats.assists, 1);
  assert.equal(sub.stats.total_matches, 1);
  // Permission, conflict and transaction rollback checks against the actual API.
  const next = await make();
  const initial = await q.call("GET", `/matches/${next.id}/offline`);
  const syncUrl = q.apiBase + `/matches/${next.id}/offline/sync`;
  const send = async (body, token = q.token) =>
    fetch(syncUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(body),
    });
  const c = (kind, data) => ({ id: crypto.randomUUID(), kind, data });
  const sheet = c("sheet", {
    players: [q.players.emile, q.players.hugo].map((p) => ({
      player_id: p.id,
      presence: "PRESENT",
      status: "STARTER",
    })),
  });
  let payload = {
    batchId: crypto.randomUUID(),
    version: initial.version,
    commands: [
      sheet,
      c("status", { status: "LIVE" }),
      c("event", {
        player_id: q.players.emile.id,
        event_type: "GOAL",
        minute: 999,
      }),
    ],
  };
  assert.equal((await send(payload)).status, 400);
  assert.equal(
    (await q.call("GET", "/matches/" + next.id)).matchPlayers.length,
    0,
    "Atomic rollback",
  );
  assert.equal((await send(payload, q.outsiderToken)).status, 403);
  await q.call("PATCH", "/matches/" + next.id, {
    opponent: "Modifié ailleurs",
  });
  payload = {
    batchId: crypto.randomUUID(),
    version: initial.version,
    commands: [sheet],
  };
  assert.equal((await send(payload)).status, 409);
  // An offline copy cannot appear under a different account on the same device.
  await page.evaluate(() =>
    localStorage.setItem("user", JSON.stringify({ id: "different-account" })),
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Préparer ce match hors ligne", exact: true })
    .waitFor();
  assert.equal(
    await page.getByText("Qui sera là ?", { exact: true }).count(),
    0,
  );
  await page.evaluate(
    (user) => localStorage.setItem("user", JSON.stringify(user)),
    q.user,
  );
  await page.goto(q.base + "/terrain/index.html#match=" + m.id);
  await page.reload();
  await page
    .getByText("Prêt hors ligne · tout est enregistré", { exact: true })
    .waitFor();
  // Logout cancellation preserves pending data; confirmation purges it across tabs.
  await q.context.setOffline(true);
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Supprimer But à 12 minutes", exact: true })
    .click();
  await page
    .getByLabel("Score de notre équipe puis de l’adversaire")
    .filter({ hasText: "0 – 0" })
    .waitFor();
  await page.route("**/offline/sync", (route) => route.abort());
  await q.context.setOffline(false);
  await page.goto(q.base + "/dashboard");
  await page.locator("header").first().getByRole("button").last().click();
  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("button", { name: "Déconnexion", exact: true }).click();
  await page.waitForFunction(() => !!localStorage.getItem("token"));
  const remaining = await page.evaluate(async () => {
    const { all } = await import("/terrain/store.js");
    return all();
  });
  assert.ok(
    remaining.some((r) => r.commands.length),
    "Cancelled logout preserves pending data",
  );
  await page.locator("header").first().getByRole("button").last().click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Déconnexion", exact: true }).click();
  await page.waitForFunction(() => !localStorage.getItem("token"));
  await page.goto(q.base + "/login");
  await page.locator("input[type=email]").waitFor();
  assert.deepEqual(
    await page.evaluate(async () => {
      const { all } = await import("/terrain/store.js");
      return all();
    }),
    [],
  );
  await page.goto(q.base + "/login");
  await page.locator("input[type=email]").fill("coach.qa@example.com");
  await page.locator("input[type=password]").fill("CoachFlowQA2026!");
  await page.getByRole("button", { name: "Connexion", exact: true }).click();
  await page.waitForURL("**/dashboard");
  q.team = previousTeam;
  q.players = previousPlayers;
  q.results.push({
    scenario: "Terrain hors ligne",
    status: "PASS",
    checks: [
      "presences",
      "but/passe/zone/corps",
      "fermeture et reouverture hors ligne",
      "remplacement",
      "but adverse",
      "cloture",
      "reponse perdue sans doublon",
      "statistiques",
      "isolation compte",
      "session expiree sans perte",
      "deconnexion annulee et purge confirmee",
      "403",
      "conflit409",
      "rollback400",
      "375/768/1280",
      "axe",
    ],
  });
  console.log(
    "PASS OFFLINE: local durability, reopen, goal/assist/substitution, finish, lost-response retry, stats, permissions, conflict, rollback, privacy and accessibility",
  );
}
