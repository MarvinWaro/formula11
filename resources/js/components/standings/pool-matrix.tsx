import { cn } from '@/lib/utils';

export type MatrixTeam = {
    id: string;
    display_name: string;
    pool_seed: number | null;
};

export type MatrixMatch = {
    id: string;
    team_a: { id: string; display_name: string } | null;
    team_b: { id: string; display_name: string } | null;
    score_a: number | null;
    score_b: number | null;
    winner_team_id: string | null;
    played_at: string | null;
};

type Props = {
    teams: MatrixTeam[];
    matches: MatrixMatch[];
};

type CellState =
    | { kind: 'self' }
    | { kind: 'unplayed' }
    | { kind: 'pending'; score: string }
    | { kind: 'won'; score: string }
    | { kind: 'lost'; score: string };

export function PoolMatrix({ teams, matches }: Props) {
    const cellFor = (rowTeamId: string, colTeamId: string): CellState => {
        if (rowTeamId === colTeamId) return { kind: 'self' };

        const match = matches.find(
            (m) =>
                (m.team_a?.id === rowTeamId && m.team_b?.id === colTeamId) ||
                (m.team_a?.id === colTeamId && m.team_b?.id === rowTeamId),
        );

        if (!match || match.score_a === null || match.score_b === null) {
            return { kind: 'unplayed' };
        }

        // Normalize so the score reads from the ROW team's perspective.
        const rowIsTeamA = match.team_a?.id === rowTeamId;
        const rowScore = rowIsTeamA ? match.score_a : match.score_b;
        const colScore = rowIsTeamA ? match.score_b : match.score_a;
        const display = `${rowScore} – ${colScore}`;

        if (!match.played_at) {
            return { kind: 'pending', score: display };
        }

        const won = match.winner_team_id === rowTeamId;
        return won
            ? { kind: 'won', score: display }
            : { kind: 'lost', score: display };
    };

    return (
        <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[36rem] border-collapse text-xs">
                <thead>
                    <tr className="bg-muted/40">
                        <th className="sticky left-0 z-10 min-w-[10rem] border-b border-r bg-muted/60 px-3 py-2 text-left font-semibold text-muted-foreground">
                            Teams
                        </th>
                        {teams.map((team) => (
                            <th
                                key={team.id}
                                className="min-w-[5rem] border-b px-2 py-2 text-center font-medium text-muted-foreground"
                            >
                                <span className="block truncate">
                                    {team.display_name}
                                </span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {teams.map((row) => (
                        <tr key={row.id} className="even:bg-muted/20">
                            <th
                                scope="row"
                                className="sticky left-0 z-10 max-w-[14rem] truncate border-r bg-card px-3 py-2 text-left text-xs font-medium"
                            >
                                {row.display_name}
                            </th>
                            {teams.map((col) => {
                                const cell = cellFor(row.id, col.id);
                                return (
                                    <td
                                        key={col.id}
                                        className={cn(
                                            'border-b px-2 py-2 text-center tabular-nums',
                                            cell.kind === 'self' &&
                                                'bg-muted/30 text-muted-foreground',
                                            cell.kind === 'won' &&
                                                'bg-emerald-500/10 font-semibold text-emerald-700 dark:text-emerald-300',
                                            cell.kind === 'lost' &&
                                                'bg-rose-500/10 font-semibold text-rose-700 dark:text-rose-300',
                                            cell.kind === 'pending' &&
                                                'text-amber-700 dark:text-amber-300',
                                        )}
                                    >
                                        {cell.kind === 'self' && '—'}
                                        {cell.kind === 'unplayed' && (
                                            <span className="text-muted-foreground">
                                                ·
                                            </span>
                                        )}
                                        {(cell.kind === 'won' ||
                                            cell.kind === 'lost' ||
                                            cell.kind === 'pending') &&
                                            cell.score}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
