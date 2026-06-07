import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, Trophy, Users } from 'lucide-react';
import { BracketTree } from '@/components/standings/bracket-tree';
import type { BracketMatch } from '@/components/standings/bracket-tree';
import { PoolMatrix } from '@/components/standings/pool-matrix';
import type { MatrixMatch, MatrixTeam } from '@/components/standings/pool-matrix';
import { StandingsTable } from '@/components/standings/standings-table';
import type { StandingsRow } from '@/components/standings/standings-table';
import { Badge } from '@/components/ui/badge';
import { index as standingsIndex } from '@/routes/standings';

type Tournament = {
    id: string;
    name: string;
    slug: string;
    organizer_name: string | null;
    venue: string | null;
    status: string;
    status_label: string;
    starts_at: string | null;
    ends_at: string | null;
};

type Category = {
    id: string;
    name: string;
    slug: string;
    division_label: string;
    skill_level_label: string;
    format: string;
    format_label: string;
    rr_points_to_win: number;
    elim_points_to_win: number;
    win_by_two: boolean;
    teams_advancing_per_bracket: number;
    rules_label: string;
};

type Pool = {
    id: string;
    name: string;
    teams: MatrixTeam[];
    matches: MatrixMatch[];
    standings: StandingsRow[];
};

type Bracket = {
    semis: BracketMatch[];
    bronze: BracketMatch | null;
    final: BracketMatch | null;
};

type Props = {
    tournament: Tournament;
    category: Category;
    pools: Pool[];
    bracket: Bracket | null;
};

export default function StandingsShow({
    tournament,
    category,
    pools,
    bracket,
}: Props) {
    const hasPools = pools.length > 0;

    return (
        <>
            <Head title={`${category.name} · ${tournament.name}`} />

            <div className="space-y-5 px-4 py-5 sm:px-6">
                {/* Back link */}
                <Link
                    href={standingsIndex(tournament.slug).url}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    All categories
                </Link>

                {/* Hero */}
                <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary to-primary/85 p-5 text-primary-foreground shadow-sm sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-accent uppercase">
                                <Trophy className="h-3 w-3" />
                                {tournament.status_label}
                            </span>
                            <h1 className="text-xl font-bold leading-tight sm:text-2xl">
                                {category.name}
                            </h1>
                            <p className="text-sm text-primary-foreground/85">
                                {tournament.name}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5 text-[11px]">
                        <Badge
                            variant="secondary"
                            className="bg-primary-foreground/15 text-primary-foreground"
                        >
                            {category.division_label}
                        </Badge>
                        <Badge
                            variant="secondary"
                            className="bg-primary-foreground/15 text-primary-foreground"
                        >
                            {category.skill_level_label}
                        </Badge>
                        <Badge
                            variant="secondary"
                            className="bg-primary-foreground/15 text-primary-foreground"
                        >
                            {category.format_label}
                        </Badge>
                        <Badge
                            variant="secondary"
                            className="bg-primary-foreground/15 text-primary-foreground"
                        >
                            {category.rules_label}
                        </Badge>
                    </div>
                </section>

                {/* Pools */}
                {!hasPools ? (
                    <div className="rounded-2xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted-foreground">
                        <Users className="mx-auto mb-3 h-8 w-8" />
                        Pools haven't been drawn yet. Standings will appear once
                        the organizer sets things up.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {pools.map((pool) => (
                            <PoolSection
                                key={pool.id}
                                pool={pool}
                                advancingCount={
                                    category.teams_advancing_per_bracket
                                }
                            />
                        ))}
                    </div>
                )}

                {/* Bracket */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                        Playoff bracket
                    </h2>
                    {bracket ? (
                        <BracketTree
                            semis={bracket.semis}
                            bronze={bracket.bronze}
                            final={bracket.final}
                        />
                    ) : (
                        <div className="rounded-2xl border border-dashed bg-card/50 p-6 text-center text-sm text-muted-foreground">
                            Pool play in progress — the bracket will appear
                            once semifinals are seeded.
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

function PoolSection({
    pool,
    advancingCount,
}: {
    pool: Pool;
    advancingCount: number;
}) {
    return (
        <section className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold">{pool.name}</h2>
                <span className="text-xs text-muted-foreground">
                    {pool.teams.length}{' '}
                    {pool.teams.length === 1 ? 'team' : 'teams'} ·{' '}
                    {pool.matches.length}{' '}
                    {pool.matches.length === 1 ? 'match' : 'matches'}
                </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <PoolMatrix teams={pool.teams} matches={pool.matches} />
                </div>
                <div className="lg:col-span-2">
                    <StandingsTable
                        rows={pool.standings as StandingsRow[]}
                        advancingCount={advancingCount}
                    />
                </div>
            </div>
        </section>
    );
}
