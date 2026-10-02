const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { filterAndSortPlayers, DEFAULT_FILTERS } = require('../src/app/dashboard/joueurs/parts/roster.ts');
const PlayerTable = require('../src/app/dashboard/joueurs/parts/PlayerTable.tsx').default;
const PlayerDetail = require('../src/app/dashboard/joueurs/parts/PlayerDetailModal.tsx').default;

const make = (id, changes = {}, statChanges = {}) => ({ id, first_name: 'Émile', last_name: 'Le Goff', status: 'ACTIVE', jersey_number: 9, ...changes,
  stats: { total_matches: 2, matches_as_starter: 1, matches_as_substitute: 1, unused_substitute: 1, goals: 1, assists: 0, recoveries: 0, ball_losses: 0, yellow_cards: 0, red_cards: 0, goals_by_zone: { ATT_CENTER: 1 }, goals_by_body_part: { HEAD: 1 }, attendance: { present: 3, absent: 1, unknown: 1, uncertain: 1, recorded: 4, rate: 75 }, ...statChanges },
});
const emptyRate = { present: 0, absent: 0, unknown: 1, uncertain: 0, recorded: 0, rate: null };

test('search ignores accents, combines full name/number and preserves the input', () => {
  const players = [make('a'), make('b', { first_name: 'Louis', last_name: 'Test', jersey_number: 10 })];
  const original = JSON.stringify(players);
  assert.deepEqual(filterAndSortPlayers(players, { ...DEFAULT_FILTERS, search: '  le EMILE 9 ' }).map(p => p.id), ['a']);
  assert.equal(JSON.stringify(players), original);
});

test('status and position filters combine; archived players remain explicitly accessible', () => {
  const players = [make('active', { position: 'FORWARD' }), make('injured', { status: 'INJURED', position: 'DEFENDER' }), make('archive', { status: 'RETIRED' })];
  assert.equal(filterAndSortPlayers(players, DEFAULT_FILTERS).length, 2);
  assert.deepEqual(filterAndSortPlayers(players, { ...DEFAULT_FILTERS, status: 'INJURED', position: 'DEFENDER' }).map(p => p.id), ['injured']);
  assert.deepEqual(filterAndSortPlayers(players, { ...DEFAULT_FILTERS, status: 'RETIRED' }).map(p => p.id), ['archive']);
});

test('numerical sorting distinguishes zero from missing values, which stay last in both directions', () => {
  const players = [make('missing', { jersey_number: null }, { attendance: emptyRate }), make('zero', { jersey_number: 2 }, { attendance: { ...emptyRate, rate: 0, absent: 1, recorded: 1 } }), make('positive', { jersey_number: 10 })];
  assert.deepEqual(filterAndSortPlayers(players, { ...DEFAULT_FILTERS, sort: 'attendance', direction: 'desc' }).map(p => p.id), ['positive', 'zero', 'missing']);
  assert.deepEqual(filterAndSortPlayers(players, { ...DEFAULT_FILTERS, sort: 'attendance', direction: 'asc' }).map(p => p.id), ['zero', 'positive', 'missing']);
  assert.deepEqual(filterAndSortPlayers(players, { ...DEFAULT_FILTERS, sort: 'number', direction: 'asc' }).map(p => p.id), ['zero', 'positive', 'missing']);
});

test('table exposes real headers and distinct desktop/mobile content without invented numbers or rates', () => {
  const html = renderToStaticMarkup(React.createElement(PlayerTable, { players: [make('a', { jersey_number: null }, { attendance: emptyRate })], filters: { ...DEFAULT_FILTERS, sort: 'goals', direction: 'desc' }, onSort() {}, onOpen() {} }));
  assert.match(html, /<table/);
  assert.match(html, /aria-sort="descending"/);
  assert.match(html, /Numéro non renseigné/);
  assert.match(html, /Aucune présence renseignée/);
  assert.match(html, /Liste des joueurs/);
  assert.doesNotMatch(html, /undefined|NaN/);
});

test('player sheet shows bench/starts/entries, additional metrics and translated detailed zones', () => {
  const html = renderToStaticMarkup(React.createElement(PlayerDetail, { player: make('a'), periodLabel: 'Cette saison', onClose() {}, onEdit() {}, onArchive() {} }));
  for (const label of ['Sur le banc, sans entrer', 'Titularisations', 'Entrées en jeu', 'Cartons jaunes', 'Récupérations', 'Attaque · centre', 'Tête', 'Présence incertaine']) assert.ok(html.includes(label), label);
  assert.match(html, /75 %/);
  assert.doesNotMatch(html, /ATT_CENTER|undefined|NaN/);
});

test('archived player sheet offers re-entry and cannot archive again', () => {
  const html = renderToStaticMarkup(React.createElement(PlayerDetail, { player: make('a', { status: 'RETIRED' }), periodLabel: 'Tous les matchs', onClose() {}, onEdit() {}, onArchive() {} }));
  assert.match(html, /Modifier \/ réintégrer/);
  assert.doesNotMatch(html, />Archiver</);
});
