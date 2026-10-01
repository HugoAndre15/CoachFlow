import { withCurrentLineup } from './current-lineup';
import { match_player_status } from '@prisma/client';

const players = [
  { player_id: 'a', status: match_player_status.STARTER, presence: 'PRESENT' },
  { player_id: 'b', status: match_player_status.SUBSTITUTE, presence: 'PRESENT' },
  { player_id: 'c', status: match_player_status.SUBSTITUTE, presence: 'ABSENT' },
];
const sub = { id: 's1', event_type: 'SUBSTITUTION', player_id: 'a', related_player_id: 'b', minute: 20 };

describe('current lineup', () => {
  it('replays saved changes without mutating starting roles or statistics', () => {
    const result = withCurrentLineup(players, [sub]);
    expect(result.map(p => p.current_status)).toEqual(['SUBSTITUTE', 'STARTER', 'SUBSTITUTE']);
    expect(result.map(p => p.status)).toEqual(players.map(p => p.status));
    expect(players[0].status).toBe('STARTER');
  });
  it('replays returning players in match order', () => {
    const back = { ...sub, id: 's2', player_id: 'b', related_player_id: 'a', minute: 40 };
    expect(withCurrentLineup(players, [back, sub]).map(p => p.current_status)).toEqual(players.map(p => p.status));
  });
  it('restores the initial lineup when a change is removed', () => {
    expect(withCurrentLineup(players, []).map(p => p.current_status)).toEqual(players.map(p => p.status));
  });
  it('ignores inconsistent legacy changes without adding a player on the pitch', () => {
    const invalid = [
      { ...sub, related_player_id: 'a' }, { ...sub, related_player_id: 'missing' },
      { ...sub, related_player_id: 'c' }, { ...sub, player_id: 'b', related_player_id: 'a' },
    ];
    expect(withCurrentLineup(players, invalid).map(p => p.current_status)).toEqual(players.map(p => p.status));
  });
  it('supports legacy presences and orders changes in the same minute by creation time', () => {
    const legacy = players.map(({ presence, ...player }) => player);
    const first = { ...sub, created_at: new Date('2026-10-01T08:00:00Z') };
    const second = { ...sub, id: 's2', player_id: 'b', related_player_id: 'a', created_at: new Date('2026-10-01T08:00:05Z') };
    expect(withCurrentLineup(legacy, [second, first]).map(p => p.current_status)).toEqual(players.map(p => p.status));
  });
});
