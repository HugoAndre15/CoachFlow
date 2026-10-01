import { Trophy } from 'lucide-react';
import type { MatchDetail } from '../../services/matchService';
import { buildMatchTimeline } from '../../lib/matchTimeline';

export default function MatchSummary({ match }: { match: MatchDetail }) {
  const timeline = buildMatchTimeline(match);
  return (
    <section className="rounded-2xl border border-neutral/20 bg-white p-4 dark:border-dark-light dark:bg-dark-lighter sm:p-5">
      <div className="mb-4 flex items-center gap-2"><Trophy className="h-5 w-5 text-accent-green" /><h2 className="font-bold text-dark dark:text-white">Résumé du match</h2></div>
      {timeline.length === 0 ? (
        <p className="py-8 text-center text-sm text-dark-light/50 dark:text-neutral/50">Aucun événement enregistré.</p>
      ) : (
        <ol className="space-y-2">
          {timeline.map(event => (
            <li key={event.id} className="flex items-start gap-3 rounded-xl bg-neutral-lighter/40 p-3 dark:bg-dark-secondary/30">
              <span className="w-10 shrink-0 text-sm font-black text-dark dark:text-white">{event.minute}&apos;</span>
              <div className="min-w-0 flex-1 break-words">
                <p className={`text-sm font-semibold ${event.isOpponent ? 'text-accent-red' : 'text-dark dark:text-white'}`}>{event.title}</p>
                {event.details && <p className="mt-0.5 text-xs text-dark-light/60 dark:text-neutral/60">{event.details}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
