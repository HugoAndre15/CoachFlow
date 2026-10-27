import assert from "node:assert/strict";
import { test } from "node:test";
import {
  preparationSheet,
  setSelection,
  preparationSummary,
} from "../public/terrain/roster.js";
import { apply } from "../public/terrain/model.js";
const make = () => ({
  match: { status: "UPCOMING" },
  sheet: [],
  events: [],
  opponents: [],
  players: Array.from({ length: 14 }, (_, i) => ({
    id: String(i),
    eligible: i !== 13,
    position:
      i < 2
        ? "GOALKEEPER"
        : i < 6
          ? "DEFENDER"
          : i < 10
            ? "MIDFIELDER"
            : "FORWARD",
  })),
});
const choose = (s, id, choice = "PRESENT") => {
  s.sheet = setSelection(s, String(id), choice);
};
test("first eleven clicks are starters, twelfth is substitute, remaining players absent", () => {
  const s = make();
  for (let i = 0; i < 12; i++) choose(s, i);
  assert.equal(
    s.sheet.filter((p) => p.presence === "PRESENT" && p.status === "STARTER")
      .length,
    11,
  );
  assert.equal(s.sheet[11].status, "SUBSTITUTE");
  assert.equal(s.sheet[12].presence, "ABSENT");
  assert.equal(preparationSummary(s).canStart, true);
});
test("eleven present minimum, uncertain presence requires confirmation", () => {
  const s = make();
  for (let i = 0; i < 10; i++) choose(s, i);
  assert.equal(preparationSummary(s).canStart, false);
  choose(s, 10);
  assert.equal(preparationSummary(s).canStart, true);
  choose(s, 11, "UNCERTAIN");
  assert.equal(preparationSummary(s).canStart, false);
  choose(s, 11, "ABSENT");
  assert.equal(preparationSummary(s).canStart, true);
});
test("deselection frees a starter slot and explicit promotion swaps at capacity", () => {
  const s = make();
  for (let i = 0; i < 12; i++) choose(s, i);
  choose(s, 0, "ABSENT");
  choose(s, 12);
  assert.equal(s.sheet[12].status, "STARTER");
  choose(s, 11, "STARTER");
  assert.equal(
    s.sheet.filter((p) => p.presence === "PRESENT" && p.status === "STARTER")
      .length,
    11,
  );
  assert.equal(s.sheet[11].status, "STARTER");
  assert.equal(s.sheet[12].status, "SUBSTITUTE");
});
test("unavailable player cannot be selected; position alerts never block eleven present", () => {
  const s = make();
  assert.throws(() => choose(s, 13), /disponible/);
  for (let i = 0; i < 11; i++) choose(s, i);
  assert.match(preparationSummary(s).warnings.join(" "), /Plusieurs gardiens/);
  assert.equal(preparationSummary(s).canStart, true);
  s.players.forEach((p) => (p.position = "DEFENDER"));
  assert.match(preparationSummary(s).warnings.join(" "), /Aucun milieu/);
  assert.match(preparationSummary(s).warnings.join(" "), /Aucun attaquant/);
  assert.equal(preparationSummary(s).canStart, true);
});
test("old snapshots without positions work; saved roles and absences survive replay", () => {
  const s = make();
  s.players.forEach((p) => delete p.position);
  s.sheet = [{ player_id: "0", presence: "UNKNOWN", status: "SUBSTITUTE" }];
  assert.equal(preparationSheet(s)[0].presence, "ABSENT");
  for (let i = 0; i < 12; i++) choose(s, i);
  const replayed = apply(make(), [
    { kind: "sheet", data: { players: s.sheet } },
  ]);
  assert.deepEqual(preparationSheet(replayed), s.sheet);
  assert.match(
    preparationSummary(s).warnings.join(" "),
    /postes ne sont pas renseignés/,
  );
  // Existing unsynchronised matches from v1 must remain replayable.
  const legacy = make();
  legacy.sheet = [
    { player_id: "0", presence: "PRESENT", status: "STARTER" },
    { player_id: "1", presence: "PRESENT", status: "STARTER" },
  ];
  assert.equal(
    apply(legacy, [{ kind: "status", data: { status: "LIVE" } }]).match.status,
    "LIVE",
  );
});
