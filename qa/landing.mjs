import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";

/** Public landing checks use a separate anonymous context before the authenticated scenarios. */
export default async function (q) {
  const context = await q.browser.newContext({
    locale: "fr-FR",
    colorScheme: "dark",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(q.base);
    await page.getByRole("heading", { level: 1 }).waitFor();
    assert.equal(await page.locator("main").count(), 1);
    assert.equal(await page.locator("header").count(), 1);
    assert.equal(await page.locator("footer").count(), 1);
    assert.match(await page.title(), /CoachFlow/);
    assert.match(
      await page.locator('meta[name="description"]').getAttribute("content"),
      /football/,
    );
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const name of ["Préparer", "Jouer", "Retrouver le bilan"]) {
        const button = page
          .getByRole("group", { name: "Explorer les étapes du match" })
          .getByRole("button", {
            name: new RegExp(name + "$"),
          });
        await button.click();
        assert.equal(await button.getAttribute("aria-pressed"), "true");
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
          "No overflow " + width + " " + name,
        );
      }
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      assert.deepEqual(
        result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.failureSummary),
        })),
        [],
        "Landing accessibility " + width,
      );
      await page.screenshot({
        path: q.out + "/landing-" + width + ".png",
        fullPage: true,
      });
    }
    await page
      .getByText("Est-ce que je peux continuer sans réseau ?", { exact: true })
      .click();
    await page
      .getByText(/Le direct classique ne bascule pas automatiquement/)
      .waitFor();
    const anchors = await page
      .locator('a[href^="#"]')
      .evaluateAll((nodes) =>
        nodes.map((n) => n.getAttribute("href").slice(1)),
      );
    for (const id of anchors)
      assert.equal(
        await page.locator('[id="' + id + '"]').count(),
        1,
        "Anchor " + id,
      );
    await page.setViewportSize({ width: 375, height: 812 });
    const mobile = page.locator("header details");
    await mobile.locator("summary").click();
    await mobile.getByRole("link", { name: "Créer mon espace" }).click();
    await page.waitForURL("**/register");
    await page.locator('input[type="email"]').waitFor();
    await page.goto(q.base);
    await page.locator("header details summary").click();
    await page
      .locator("header details")
      .getByRole("link", { name: "Se connecter", exact: true })
      .click();
    await page.waitForURL("**/login");
    await page.locator('input[type="password"]').waitFor();
    assert.deepEqual(errors, []);
    q.results.push({
      scenario: "Landing publique",
      status: "PASS",
      checks: [
        "375/768/1280",
        "interactive preview",
        "FAQ",
        "anchors",
        "mobile navigation",
        "registration/login entry",
        "axe",
        "no runtime errors",
      ],
    });
    console.log(
      "PASS LANDING: responsive, interactive preview, FAQ, links, auth entry and accessibility",
    );
  } catch (error) {
    await page
      .screenshot({ path: q.out + "/landing-failure.png", fullPage: true })
      .catch(() => {});
    fs.writeFileSync(
      q.out + "/landing-failure.txt",
      await page
        .locator("body")
        .innerText()
        .catch(() => ""),
    );
    throw error;
  } finally {
    await context.close();
  }
}
