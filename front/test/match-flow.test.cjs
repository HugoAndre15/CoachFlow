const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { buildMatchTimeline } = require('../src/lib/matchTimeline.ts');
const MatchSummary = require('../src/components/matches/MatchSummary.tsx').default;

const player = { id: 'p9', first_name: 'Ilyes', last_name: 'Test' };
const incoming = { id: 'p12', first_name: 'Louis', last_name: 'Test' };
const goal = { id: 'goal', player, player_id: player.id, event_type: 'GOAL', minute: 18, zone: 'BOX', body_part: 'HEAD' };
const opponentGoal = { id: 'opp', event_type: 'GOAL', minute: 25, jersey_number: '7' };
const match = {
  opponent: 'FC Rival', matchEvents: [], opponentEvents: [],
  matchPlayers: [{ player_id: player.id, player }, { player_id: incoming.id, player: incoming }],
};

test('an opponent-only match renders its goal instead of the empty state', () => {
  const html = renderToStaticMarkup(React.createElement(MatchSummary, { match: { ...match, opponentEvents: [opponentGoal] } }));
  assert.match(html, /But adverse · FC Rival/);
  assert.match(html, /Joueur n° 7/);
  assert.doesNotMatch(html, /Aucun événement/);
});

test('the final summary mixes both teams in chronological order without modifying the sources', () => {
  const card = { ...opponentGoal, id: 'card', event_type: 'YELLOW_CARD', minute: 12 };
  const input = { ...match, matchEvents: [goal], opponentEvents: [opponentGoal, card] };
  const before = JSON.stringify(input);
  const events = buildMatchTimeline(input);
  assert.deepEqual(events.map(event => event.minute), [12, 18, 25]);
  assert.deepEqual(events.map(event => event.isOpponent), [true, false, true]);
  assert.equal(JSON.stringify(input), before);
});

test('the summary preserves goal details and names both players in a substitution', () => {
  const substitution = { ...goal, id: 'sub', event_type: 'SUBSTITUTION', minute: 30, zone: undefined, body_part: undefined, related_player_id: incoming.id };
  const events = buildMatchTimeline({ ...match, matchEvents: [goal, substitution] });
  assert.equal(events[0].details, 'Surface · Tête');
  assert.equal(events[1].title, 'Changement · Ilyes Test sort → Louis Test entre');
});

test('events in the same minute use recording order', () => {
  const events = buildMatchTimeline({ ...match,
    matchEvents: [{ ...goal, created_at: '2026-10-01T08:00:05Z' }],
    opponentEvents: [{ ...opponentGoal, minute: 18, created_at: '2026-10-01T08:00:00Z' }],
  });
  assert.equal(events[0].isOpponent, true);
});

test('the empty state is only shown when neither team has an event', () => {
  const html = renderToStaticMarkup(React.createElement(MatchSummary, { match }));
  assert.match(html, /Aucun événement enregistré/);
});
