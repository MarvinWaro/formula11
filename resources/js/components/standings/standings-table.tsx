import { cn } from '@/lib/utils';

export type StandingsRow = {
    rank: number;
    team_id: string;
    display_name: string;
    wins: number;
    losses: number;
    points_for: number;
    points_against: number;
    point_diff: number;
    played: number;
};

type Props = {
    rows: StandingsRow[];
    advancingCount?: number;
    highlightTeamIds?: string[];
};

export function StandingsTable({
    rows,
    advancingCount = 0,
    highlightTeamIds = [],
}: Props) {
    const highlightSet = new Set(highlightTeamIds);
    return (
        <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] tracking-wider uppercase">
                    <tr>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                            #
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                            Team
                        </th>
                        <th className="px-2 py-2 text-center font-semibold text-muted-foreground">
                            W
                        </th>
                        <th className="px-2 py-2 text-center font-semibold text-muted-foreground">
                            L
                        </th>
                        <th className="px-2 py-2 text-center font-semibold text-muted-foreground">
                            PD
                        </th>
                        <th className="px-2 py-2 text-center font-semibold text-muted-foreground">
                            PF
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const advancing =
                            advancingCount > 0 && row.rank <= advancingCount;
                        const isPlayer = highlightSet.has(row.team_id);
                        return (
                            <tr
                                key={row.team_id}
                                className={cn(
                                    'border-t',
                                    advancing && !isPlayer && 'bg-primary/5',
                                    isPlayer &&
                                        'bg-amber-500/15 ring-1 ring-amber-500/40 dark:bg-amber-500/10',
                                )}
                            >
                                <td
                                    className={cn(
                                        'px-3 py-2 text-left font-semibold tabular-nums',
                                        advancing && 'text-primary',
                                        isPlayer &&
                                            'text-amber-700 dark:text-amber-300',
                                    )}
                                >
                                    {row.rank}
                                </td>
                                <td
                                    className={cn(
                                        'max-w-[16rem] truncate px-3 py-2',
                                        isPlayer && 'font-semibold',
                                    )}
                                >
                                    {row.display_name}
                                    {isPlayer && (
                                        <span className="ml-1.5 rounded bg-amber-500/20 px-1 py-0.5 text-[9px] font-bold tracking-wider text-amber-700 uppercase dark:text-amber-300">
                                            You
                                        </span>
                                    )}
                                </td>
                                <td className="px-2 py-2 text-center tabular-nums">
                                    {row.wins}
                                </td>
                                <td className="px-2 py-2 text-center tabular-nums">
                                    {row.losses}
                                </td>
                                <td
                                    className={cn(
                                        'px-2 py-2 text-center tabular-nums',
                                        row.point_diff > 0 &&
                                            'text-emerald-700 dark:text-emerald-300',
                                        row.point_diff < 0 &&
                                            'text-rose-700 dark:text-rose-300',
                                    )}
                                >
                                    {row.point_diff > 0 ? '+' : ''}
                                    {row.point_diff}
                                </td>
                                <td className="px-2 py-2 text-center tabular-nums">
                                    {row.points_for}
                                </td>
                            </tr>
                        );
                    })}
                    {rows.length === 0 && (
                        <tr>
                            <td
                                colSpan={6}
                                className="px-3 py-6 text-center text-xs text-muted-foreground"
                            >
                                No teams in this pool yet.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
