import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";

export default async function reviewInterface(q) {
  const context = await q.browser.newContext({
    colorScheme: "dark", locale: "fr-FR", viewport: { width: 375, height: 812 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  const theme = () => page.locator("html").getAttribute("data-theme");
  async function toggle(name) {
    const control = page.getByRole("switch", { name: "Mode sombre" });
    await control.click();
    assert.equal(await control.getAttribute("aria-checked"), String(name === "sombre"));
  }
  try {
    await page.goto(q.base);
    assert.equal(await theme(), "light", "A new visitor starts in light mode even on a dark device");
    const light = await page.locator("body").evaluate(el => getComputedStyle(el).backgroundColor);
    await toggle("sombre");
    const dark = await page.locator("body").evaluate(el => getComputedStyle(el).backgroundColor);
    assert.notEqual(light, dark);
    await page.goto(q.base + "/register");
    assert.equal(await theme(), "dark");
    await toggle("clair");
    const second = await context.newPage();
    await second.goto(q.base + "/login");
    await second.getByRole("switch", { name: "Mode sombre" }).click();
    await page.locator('html[data-theme="dark"]').waitFor();
    await second.close();
    await page.reload();
    assert.equal(await theme(), "dark");
    await page.getByLabel("Prénom", { exact: true }).fill("Coach");
    await page.getByLabel("Nom", { exact: true }).fill("Interface");
    await page.getByLabel("Adresse e-mail").fill("interface.qa@example.com");
    await page.getByLabel("Mot de passe", { exact: true }).fill("CoachFlowQA2026!");
    await page.getByLabel("Confirmer le mot de passe", { exact: true }).fill("CoachFlowQA2026!");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await page.getByRole("heading", { name: "Bienvenue sur CoachFlow" }).waitFor();
    await page.getByRole("button", { name: "Créer un club" }).click();
    const form = page.getByRole("dialog");
    await form.getByLabel("Nom du club", { exact: false }).fill("FC Horizon QA");
    await form.getByRole("button", { name: "Créer le club" }).click();
    await page.getByRole("button", { name: "Créer mon équipe" }).click();
    await form.getByLabel(/Nom de l'équipe/).fill("U17 A");
    await form.getByLabel(/Catégorie/).selectOption("U17");
    await form.getByRole("button", { name: "Créer", exact: true }).click();
    await page.getByRole("heading", { name: "Vue d’équipe", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: /Changer d’équipe/ }).count(), 0);

    const token = await page.evaluate(() => localStorage.getItem("token"));
    const club = await q.call("POST", "/clubs", { name: "US Rivage QA" }, token);
    const team = await q.call("POST", "/teams", { name: "U17 A", category: "U17", club_id: club.id }, token);
    await page.reload();
    const picker = () => page.getByRole("button", { name: /Changer d’équipe/ });
    await picker().click();
    await page.getByRole("region", { name: club.name }).getByRole("button", { name: /U17 A/ }).click();
    await page.getByRole("button", { name: /Changer d’équipe.*US Rivage QA/ }).waitFor();
    await page.reload();
    await page.getByRole("button", { name: /Changer d’équipe.*US Rivage QA/ }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem("activeTeamId")), team.id);

    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 812 });
      const nav = page.getByRole("navigation", { name: width < 1024 ? "Navigation mobile" : "Navigation principale", exact: true });
      await nav.getByRole("link", { name: "Joueurs", exact: true }).click();
      await page.getByRole("heading", { name: "L’effectif", exact: true }).waitFor();
      await nav.getByRole("link", { name: "Vue d’équipe" }).click();
      await page.getByRole("heading", { name: "Vue d’équipe" }).waitFor();
    }
    await page.getByRole("button", { name: "Réduire le menu" }).click();
    await page.getByRole("navigation", { name: "Navigation principale", exact: true }).getByRole("link", { name: "Joueurs" }).waitFor();
    await page.getByRole("button", { name: "Agrandir le menu" }).click();
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole("button", { name: "Plus" }).click();
    assert.equal(await page.getByRole("searchbox").evaluate(el => el === document.activeElement), false);
    await page.getByRole("searchbox").fill("dashboard");
    await page.getByRole("dialog").getByRole("link", { name: "Vue d’équipe" }).waitFor();
    await page.getByRole("searchbox").fill("clubs");
    await page.getByRole("dialog").getByRole("link", { name: "Mes clubs" }).click();
    await page.waitForURL("**/dashboard/clubs");
    await page.getByRole("button", { name: "Mon compte" }).click();
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);

    await page.goto(q.base + "/dashboard");
    await picker().waitFor();
    for (const next of ["clair", "sombre"]) {
      await toggle(next);
      await page.getByRole("heading", { name: "Le bilan se construit au fil des matchs.", exact: true }).waitFor();
      await page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));
      const audit = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
      assert.deepEqual(audit.violations.map(item => [item.id, item.nodes.map(n => ({ target: n.target, message: n.failureSummary }))]), []);
      await page.screenshot({ path: q.out + "/theme-" + next + "-375.png" });
    }
    q.results.push({ scenario: "Thèmes, création de compte, navigation et sélection multi-club", status: "PASS" });
    console.log("PASS interface: thème, persistance, compte neuf, club, équipe et navigation responsive");
  } finally {
    await context.close();
  }
}
