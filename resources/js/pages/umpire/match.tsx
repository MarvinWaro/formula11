import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, MapPin, Minus, Plus, Trophy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import UmpireScoringController from '@/actions/App/Http/Controllers/Umpire/ScoringController';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { show as standingsShow } from '@/routes/standings';
import { index as umpireIndex } from '@/routes/umpire';

type Team = { id: string; display_name: string };

type UmpireMatchProps = {
    match: {
        id: string;
        stage: string;
        sequence: number;
        court_number: string | null;
        score_a: number | null;
        score_b: number | null;
        winner_team_id: string | null;
        played_at: string | null;
        scored_at: string | null;
        scored_by: { id: string; name: string } | null;
        team_a: Team;
        team_b: Team;
    };
    category: {
        id: string;
        name: string;
        slug: string;
        target_points: number;
        win_by_two: boolean;
        rules_label: string;
    };
    tournament: { id: string; name: string; slug: string };
    pool: { id: string; name: string } | null;
};

const AUTOSAVE_DELAY_MS = 800;

export default function UmpireMatch({
    match,
    category,
    tournament,
    pool,
}: UmpireMatchProps) {
    const [scoreA, setScoreA] = useState<number>(match.score_a ?? 0);
    const [scoreB, setScoreB] = useState<number>(match.score_b ?? 0);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMounted = useRef(false);

    const winCondition = computeWinCondition(
        scoreA,
        scoreB,
        category.target_points,
        category.win_by_two,
    );

    useEffect(() => {
        // Skip the initial render — only autosave on real user changes.
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }

        // Don't autosave once the umpire has hit "Submit final score" —
        // a late PATCH against a now-finalized match would throw 422 and
        // clobber the redirect Inertia is mid-flight on.
        if (submitting) return;

        if (timer.current) {
            clearTimeout(timer.current);
        }

        timer.current = setTimeout(() => {
            setSaving(true);
            router.patch(
                UmpireScoringController.updateScore(match.id).url,
                { score_a: scoreA, score_b: scoreB },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onFinish: () => setSaving(false),
                },
            );
        }, AUTOSAVE_DELAY_MS);

        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [scoreA, scoreB, match.id, submitting]);

    const handleFinalize = () => {
        if (!winCondition.canFinalize || submitting) return;

        // Kill any pending autosave so a late PATCH can't race the redirect.
        if (timer.current) {
            clearTimeout(timer.current);
            timer.current = null;
        }
        router.cancelAll();

        setSubmitting(true);
        router.post(
            UmpireScoringController.finalize(match.id).url,
            { score_a: scoreA, score_b: scoreB },
            { onFinish: () => setSubmitting(false) },
        );
    };

    return (
        <>
            <Head title={`Scoring · ${tournament.name}`} />

            <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
                <header className="space-y-1">
                    <Link
                        href={umpireIndex().url}
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        All matches
                    </Link>
                    <h1 className="truncate text-base font-semibold">
                        {tournament.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span
                            className={cn(
                                'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold',
                                match.court_number !== null
                                    ? 'border-primary/40 bg-primary/10 text-primary'
                                    : 'border-dashed border-muted-foreground/30 bg-muted/40 text-muted-foreground',
                            )}
                        >
                            <MapPin className="h-3 w-3" />
                            {match.court_number !== null
                                ? `Court ${match.court_number}`
                                : 'No court yet'}
                            <span className="text-muted-foreground">·</span>
                            <span>Game {match.sequence}</span>
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {category.name}
                        {pool && ` · ${pool.name}`} · {category.rules_label}
                    </p>
                    <Link
                        href={
                            standingsShow([tournament.slug, category.slug]).url
                        }
                        className="text-xs font-medium text-primary hover:underline"
                    >
                        View standings & bracket →
                    </Link>
                </header>

                <TeamScoreCard
                    label="Team A"
                    team={match.team_a}
                    score={scoreA}
                    onIncrement={() => setScoreA((s) => Math.min(99, s + 1))}
                    onDecrement={() => setScoreA((s) => Math.max(0, s - 1))}
                    highlighted={
                        winCondition.canFinalize && scoreA > scoreB
                    }
                />

                <TeamScoreCard
                    label="Team B"
                    team={match.team_b}
                    score={scoreB}
                    onIncrement={() => setScoreB((s) => Math.min(99, s + 1))}
                    onDecrement={() => setScoreB((s) => Math.max(0, s - 1))}
                    highlighted={
                        winCondition.canFinalize && scoreB > scoreA
                    }
                />

                <div className="rounded-xl border bg-card/50 p-3 text-xs text-muted-foreground">
                    {saving ? (
                        <span>Saving…</span>
                    ) : winCondition.message ? (
                        <span>{winCondition.message}</span>
                    ) : (
                        <span>
                            Auto-saved on each tap. Hit “Submit final score”
                            once a team wins.
                        </span>
                    )}
                </div>

                <Button
                    type="button"
                    size="lg"
                    className="h-14 text-base"
                    disabled={!winCondition.canFinalize || submitting}
                    onClick={handleFinalize}
                >
                    <Trophy className="mr-2 h-5 w-5" />
                    {submitting ? 'Submitting…' : 'Submit final score'}
                </Button>
            </div>
        </>
    );
}

function TeamScoreCard({
    label,
    team,
    score,
    onIncrement,
    onDecrement,
    highlighted,
}: {
    label: string;
    team: Team;
    score: number;
    onIncrement: () => void;
    onDecrement: () => void;
    highlighted: boolean;
}) {
    return (
        <section
            className={cn(
                'rounded-2xl border bg-card p-4 shadow-sm transition-colors sm:flex sm:items-center sm:gap-3 sm:p-5',
                highlighted &&
                    'border-primary/60 bg-primary/5 ring-2 ring-primary/20',
            )}
        >
            <div className="min-w-0 sm:flex-1">
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {label}
                </p>
                <p className="truncate text-sm font-medium">
                    {team.display_name}
                </p>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 sm:mt-0 sm:justify-end">
                <button
                    type="button"
                    onClick={onDecrement}
                    aria-label={`Decrease ${label} score`}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-background text-foreground transition-colors hover:bg-muted active:scale-95 sm:h-11 sm:w-11"
                >
                    <Minus className="h-5 w-5" />
                </button>

                <span className="flex-1 text-center text-5xl font-bold tabular-nums sm:flex-none sm:min-w-[3ch] sm:text-4xl">
                    {score}
                </span>

                <button
                    type="button"
                    onClick={onIncrement}
                    aria-label={`Increase ${label} score`}
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:bg-primary/90 active:scale-95 sm:h-14 sm:w-14"
                >
                    <Plus className="h-8 w-8 sm:h-7 sm:w-7" />
                </button>
            </div>
        </section>
    );
}

function computeWinCondition(
    scoreA: number,
    scoreB: number,
    target: number,
    winByTwo: boolean,
): { canFinalize: boolean; message: string | null } {
    const leader = Math.max(scoreA, scoreB);
    const trailer = Math.min(scoreA, scoreB);
    const margin = leader - trailer;

    if (scoreA === scoreB && scoreA === 0) {
        return { canFinalize: false, message: null };
    }

    if (scoreA === scoreB) {
        return {
            canFinalize: false,
            message: `Tied at ${scoreA}. Play continues.`,
        };
    }

    if (leader < target) {
        return {
            canFinalize: false,
            message: `Race to ${target} — leader at ${leader}.`,
        };
    }

    const winBy = winByTwo ? 2 : 1;

    if (margin < winBy) {
        return {
            canFinalize: false,
            message: `Must win by ${winBy}. Currently up by ${margin}.`,
        };
    }

    return {
        canFinalize: true,
        message: `Game point reached — ready to submit.`,
    };
}
