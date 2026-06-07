import { Head, Link } from '@inertiajs/react';
import { ChevronRight, MapPin, Timer, Trophy } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { show as matchShow } from '@/routes/umpire/matches';

type UmpireMatch = {
    id: string;
    stage: string;
    sequence: number;
    court_number: string | null;
    assigned_umpire: { id: string; name: string } | null;
    score_a: number | null;
    score_b: number | null;
    category_name: string;
    pool_name: string | null;
    team_a: string | null;
    team_b: string | null;
    in_progress: boolean;
};

type UmpireGroup = {
    tournament: {
        id: string;
        name: string;
        slug: string;
    };
    matches: UmpireMatch[];
};

function CourtGameBadge({
    courtNumber,
    sequence,
}: {
    courtNumber: string | null;
    sequence: number;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold',
                courtNumber !== null
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-dashed border-muted-foreground/30 bg-muted/40 text-muted-foreground',
            )}
        >
            <MapPin className="h-3 w-3" />
            {courtNumber !== null ? `Court ${courtNumber}` : 'No court'}
            <span className="text-muted-foreground">·</span>
            <span>Game {sequence}</span>
        </span>
    );
}

export default function UmpireIndex({
    groups,
    currentUserId,
}: {
    groups: UmpireGroup[];
    currentUserId: string;
}) {
    // Split each tournament's matches into "yours" (assigned to me) and
    // "others". Tournaments that end up with nothing in a given bucket
    // simply don't render in that section.
    const yoursByTournament = groups
        .map((g) => ({
            tournament: g.tournament,
            matches: g.matches.filter(
                (m) => m.assigned_umpire?.id === currentUserId,
            ),
        }))
        .filter((g) => g.matches.length > 0);

    const othersByTournament = groups
        .map((g) => ({
            tournament: g.tournament,
            matches: g.matches.filter(
                (m) => m.assigned_umpire?.id !== currentUserId,
            ),
        }))
        .filter((g) => g.matches.length > 0);

    const hasAny = yoursByTournament.length > 0 || othersByTournament.length > 0;

    return (
        <>
            <Head title="Umpire" />

            <div className="space-y-5 px-4 py-5 sm:px-6">
                <Heading
                    title="Umpire"
                    description="Tap a match to record live scores. Matches stay here until they're finalized."
                />

                {!hasAny ? (
                    <div className="rounded-2xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted-foreground">
                        <Timer className="mx-auto mb-3 h-8 w-8" />
                        No open matches right now. Check back once a category
                        has scheduled play.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {yoursByTournament.length > 0 && (
                            <SectionGroup
                                heading="Your assigned matches"
                                tone="primary"
                                groups={yoursByTournament}
                                currentUserId={currentUserId}
                            />
                        )}
                        {othersByTournament.length > 0 && (
                            <SectionGroup
                                heading={
                                    yoursByTournament.length > 0
                                        ? 'Other open matches'
                                        : 'Open matches'
                                }
                                tone="muted"
                                groups={othersByTournament}
                                currentUserId={currentUserId}
                            />
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

function SectionGroup({
    heading,
    tone,
    groups,
    currentUserId,
}: {
    heading: string;
    tone: 'primary' | 'muted';
    groups: UmpireGroup[];
    currentUserId: string;
}) {
    return (
        <section className="space-y-3">
            <h2
                className={cn(
                    'text-sm font-semibold tracking-wide uppercase',
                    tone === 'primary'
                        ? 'text-primary'
                        : 'text-muted-foreground',
                )}
            >
                {heading}
            </h2>
            <div className="space-y-5">
                {groups.map((group) => (
                    <section
                        key={`${heading}-${group.tournament.id}`}
                        className="overflow-hidden rounded-2xl border bg-card shadow-sm"
                    >
                        <header className="flex items-center gap-3 border-b bg-muted/40 px-4 py-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                                <Trophy className="h-4 w-4" />
                            </span>
                            <h3 className="text-sm font-semibold leading-tight">
                                {group.tournament.name}
                            </h3>
                        </header>
                        <ul className="divide-y">
                            {group.matches.map((match) => (
                                <MatchListItem
                                    key={match.id}
                                    match={match}
                                    currentUserId={currentUserId}
                                />
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </section>
    );
}

function MatchListItem({
    match,
    currentUserId,
}: {
    match: UmpireMatch;
    currentUserId: string;
}) {
    const yours = match.assigned_umpire?.id === currentUserId;
    const someoneElse =
        match.assigned_umpire !== null &&
        match.assigned_umpire.id !== currentUserId;

    return (
        <li>
            <Link
                href={matchShow(match.id).url}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
            >
                <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <CourtGameBadge
                            courtNumber={match.court_number}
                            sequence={match.sequence}
                        />
                        <Badge variant="outline" className="text-[10px]">
                            {match.category_name}
                        </Badge>
                        {match.pool_name && (
                            <Badge variant="secondary" className="text-[10px]">
                                {match.pool_name}
                            </Badge>
                        )}
                        {yours && (
                            <Badge className="bg-primary/15 text-[10px] text-primary hover:bg-primary/15">
                                Yours
                            </Badge>
                        )}
                        {someoneElse && (
                            <Badge
                                variant="outline"
                                className="border-muted-foreground/30 text-[10px] text-muted-foreground"
                            >
                                Assigned to {match.assigned_umpire?.name}
                            </Badge>
                        )}
                        {match.in_progress && (
                            <Badge className="bg-amber-500/15 text-[10px] text-amber-700 hover:bg-amber-500/15 dark:text-amber-300">
                                In progress
                            </Badge>
                        )}
                    </div>
                    <div className="truncate text-sm font-medium">
                        {match.team_a ?? 'TBA'}{' '}
                        <span className="text-muted-foreground">vs</span>{' '}
                        {match.team_b ?? 'TBA'}
                    </div>
                    {match.in_progress && (
                        <div className="text-xs text-muted-foreground">
                            {match.score_a ?? 0}
                            {' – '}
                            {match.score_b ?? 0}
                        </div>
                    )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
        </li>
    );
}
