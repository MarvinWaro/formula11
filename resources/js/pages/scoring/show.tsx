import { Form, Head, Link, router, useForm } from '@inertiajs/react';
import {
    BookOpen,
    Check,
    ChevronLeft,
    Crown,
    Loader2,
    Medal,
    Pencil,
    Plus,
    RotateCcw,
    ShieldQuestion,
    Sparkles,
    Trash2,
    Trophy,
    Users,
    Wand2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import MatchController from '@/actions/App/Http/Controllers/Admin/Scoring/MatchController';
import PlayoffsController from '@/actions/App/Http/Controllers/Admin/Scoring/PlayoffsController';
import PoolController from '@/actions/App/Http/Controllers/Admin/Scoring/PoolController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { index as scoringIndex } from '@/routes/admin/scoring';
import { show as tournamentShow } from '@/routes/admin/tournaments';
import { show as standingsShow } from '@/routes/standings';
import type {
    ScoringMatch,
    ScoringPool,
    ScoringShowProps,
    ScoringTeam,
} from '@/types';

export default function ScoringShow({
    tournament,
    category,
    pools,
    unassignedTeams,
    bracket,
    poolPlay,
    availableUmpires,
    permissions,
}: ScoringShowProps) {
    return (
        <>
            <Head title={`Scoring – ${category.name}`} />

            <div className="space-y-6 px-4 py-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <Link
                            href={tournamentShow(tournament.slug).url}
                            className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <ChevronLeft className="h-3 w-3" />
                            {tournament.name}
                        </Link>
                        <Heading
                            title={category.name}
                            description={`${category.division_label} · ${category.skill_level_label} · ${category.format_label}`}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button asChild variant="outline">
                            <Link
                                href={
                                    standingsShow([
                                        tournament.slug,
                                        category.slug,
                                    ]).url
                                }
                            >
                                Public standings view
                            </Link>
                        </Button>
                        {permissions.canManage && unassignedTeams.length > 0 && (
                            <PoolFormDialog
                                mode="create"
                                tournament={tournament.slug}
                                category={category.id}
                                availableTeams={unassignedTeams}
                                initialSelectedIds={[]}
                            >
                                <Button>
                                    <Plus className="h-4 w-4" /> New pool
                                </Button>
                            </PoolFormDialog>
                        )}
                    </div>
                </div>

                <FormatRules
                    format={category.format}
                    rrPoints={category.rr_points_to_win}
                    elimPoints={category.elim_points_to_win}
                />

                <PlayoffPanel
                    tournamentSlug={tournament.slug}
                    categoryId={category.id}
                    poolPlay={poolPlay}
                    bracket={bracket}
                    canManage={permissions.canManage}
                />

                {unassignedTeams.length > 0 && (
                    <section className="rounded-2xl border border-dashed bg-card/50 p-4">
                        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            Unassigned teams ({unassignedTeams.length})
                        </h2>
                        <p className="mb-3 text-xs text-muted-foreground">
                            Drop these teams into a pool to start scoring.
                        </p>
                        <ul className="flex flex-wrap gap-2">
                            {unassignedTeams.map((t) => (
                                <li key={t.id}>
                                    <Badge variant="secondary">
                                        {t.display_name}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {pools.length === 0 ? (
                    <div className="rounded-2xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted-foreground">
                        <Trophy className="mx-auto mb-3 h-8 w-8" />
                        No pools yet. Create one to assign teams and generate
                        matches.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {pools.map((pool) => (
                            <PoolBlock
                                key={pool.id}
                                pool={pool}
                                tournamentSlug={tournament.slug}
                                categoryId={category.id}
                                unassignedTeams={unassignedTeams}
                                rrPoints={category.rr_points_to_win}
                                availableUmpires={availableUmpires}
                                canManage={permissions.canManage}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function FormatRules({
    format,
    rrPoints,
    elimPoints,
}: {
    format: string;
    rrPoints: number;
    elimPoints: number;
}) {
    const usesRR = format !== 'single_elimination';
    const usesElim = format !== 'round_robin';
    const usesBoth = format === 'round_robin_elimination';

    return (
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold tracking-wide uppercase">
                    Format rules
                </h2>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
                {usesRR && (
                    <RuleCard
                        title="Pool / Round-robin"
                        body={
                            <>
                                Teams play every other team inside their pool.
                                Race to{' '}
                                <span className="font-semibold">{rrPoints}</span>{' '}
                                points per game. Standings are by wins, then
                                point differential.
                            </>
                        }
                    />
                )}
                {usesElim && (
                    <RuleCard
                        title={
                            usesBoth ? 'Knockout finals' : 'Single elimination'
                        }
                        body={
                            <>
                                {usesBoth
                                    ? 'Top pool finishers cross over: semifinals → battle for 3rd → championship. '
                                    : 'Bracket play with no second chances. '}
                                Race to{' '}
                                <span className="font-semibold">
                                    {elimPoints}
                                </span>{' '}
                                points per game.
                            </>
                        }
                    />
                )}
            </div>
        </div>
    );
}

function RuleCard({ title, body }: { title: string; body: React.ReactNode }) {
    return (
        <div className="rounded-xl bg-muted/40 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <Sparkles className="h-3 w-3" />
                {title}
            </div>
            <p className="text-sm leading-relaxed text-foreground">{body}</p>
        </div>
    );
}

type PoolPlayProgress = {
    total: number;
    finalized: number;
    has_matches: boolean;
    complete: boolean;
};

type BracketMatchPayload = {
    id: string;
    sequence: number;
    stage: string;
    team_a: { id: string; display_name: string } | null;
    team_b: { id: string; display_name: string } | null;
    score_a: number | null;
    score_b: number | null;
    winner_team_id: string | null;
    played_at: string | null;
};

type BracketPayload = {
    semis: BracketMatchPayload[];
    bronze: BracketMatchPayload | null;
    final: BracketMatchPayload | null;
} | null;

type PlayoffPreview = {
    semis: { slot: string; team_a: string | null; team_b: string | null }[];
    source: string;
};

function PlayoffPanel({
    tournamentSlug,
    categoryId,
    poolPlay,
    bracket,
    canManage,
}: {
    tournamentSlug: string;
    categoryId: string;
    poolPlay: PoolPlayProgress;
    bracket: BracketPayload;
    canManage: boolean;
}) {
    const champion =
        bracket?.final?.played_at && bracket.final.winner_team_id
            ? bracket.final.winner_team_id === bracket.final.team_a?.id
                ? bracket.final.team_a
                : bracket.final.team_b
            : null;

    return (
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Trophy className="h-5 w-5" />
                    </span>
                    <div>
                        <h2 className="text-base font-semibold">Playoffs</h2>
                        <PlayoffStatusLine
                            poolPlay={poolPlay}
                            bracket={bracket}
                            champion={champion}
                        />
                    </div>
                </div>

                {canManage && (
                    <PlayoffActions
                        tournamentSlug={tournamentSlug}
                        categoryId={categoryId}
                        poolPlay={poolPlay}
                        bracket={bracket}
                    />
                )}
            </div>

            {bracket && <BracketSummary bracket={bracket} />}
        </section>
    );
}

function PlayoffStatusLine({
    poolPlay,
    bracket,
    champion,
}: {
    poolPlay: PoolPlayProgress;
    bracket: BracketPayload;
    champion: { id: string; display_name: string } | null;
}) {
    if (!poolPlay.has_matches) {
        return (
            <p className="mt-0.5 text-xs text-muted-foreground">
                Generate pool matches first — the playoff bracket is built from
                the final pool standings.
            </p>
        );
    }

    if (!poolPlay.complete && !bracket) {
        const remaining = poolPlay.total - poolPlay.finalized;
        return (
            <p className="mt-0.5 text-xs text-muted-foreground">
                Pool play in progress —{' '}
                <span className="font-medium text-foreground">
                    {poolPlay.finalized}/{poolPlay.total}
                </span>{' '}
                matches done, {remaining} remaining before the bracket can be
                generated.
            </p>
        );
    }

    if (poolPlay.complete && !bracket) {
        return (
            <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                Pool play complete — ready to generate the playoff bracket.
            </p>
        );
    }

    if (bracket && champion) {
        return (
            <p className="mt-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                🏆 Champion: {champion.display_name}
            </p>
        );
    }

    if (bracket) {
        return (
            <p className="mt-0.5 text-xs text-muted-foreground">
                Bracket in progress — score the semifinals to advance teams
                automatically.
            </p>
        );
    }

    return null;
}

function PlayoffActions({
    tournamentSlug,
    categoryId,
    poolPlay,
    bracket,
}: {
    tournamentSlug: string;
    categoryId: string;
    poolPlay: PoolPlayProgress;
    bracket: BracketPayload;
}) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [resetOpen, setResetOpen] = useState(false);
    const [preview, setPreview] = useState<PlayoffPreview | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const openPreview = async () => {
        setPreviewOpen(true);
        setLoadingPreview(true);
        setPreviewError(null);
        try {
            const res = await fetch(
                PlayoffsController.preview({
                    tournament: tournamentSlug,
                    category: categoryId,
                }).url,
                {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                },
            );
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                const msg =
                    json?.errors?.bracket?.[0] ??
                    json?.message ??
                    'Unable to compute preview.';
                setPreviewError(msg);
                setPreview(null);
            } else {
                setPreview(await res.json());
            }
        } catch {
            setPreviewError('Network error fetching preview.');
        } finally {
            setLoadingPreview(false);
        }
    };

    const confirmGenerate = () => {
        setSubmitting(true);
        router.post(
            PlayoffsController.store({
                tournament: tournamentSlug,
                category: categoryId,
            }).url,
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setSubmitting(false);
                    setPreviewOpen(false);
                },
            },
        );
    };

    const confirmReset = () => {
        setSubmitting(true);
        router.delete(
            PlayoffsController.destroy({
                tournament: tournamentSlug,
                category: categoryId,
            }).url,
            {
                preserveScroll: true,
                onFinish: () => {
                    setSubmitting(false);
                    setResetOpen(false);
                },
            },
        );
    };

    if (bracket) {
        return (
            <Dialog open={resetOpen} onOpenChange={setResetOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Trash2 className="h-3.5 w-3.5" /> Reset bracket
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset playoff bracket?</DialogTitle>
                        <DialogDescription>
                            This deletes the semifinal, bronze, and final
                            matches. Pool play and standings stay intact. Any
                            bracket match that's already finalized must be
                            score-reset first.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="ghost" disabled={submitting}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={confirmReset}
                            disabled={submitting}
                        >
                            {submitting ? 'Resetting…' : 'Reset bracket'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
                <Button
                    onClick={openPreview}
                    disabled={!poolPlay.complete}
                    size="sm"
                >
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate playoffs
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate playoff bracket</DialogTitle>
                    <DialogDescription>
                        These pairings come from the final pool standings.
                        You can reset the bracket later if needed.
                    </DialogDescription>
                </DialogHeader>

                {loadingPreview ? (
                    <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Computing pairings…
                    </div>
                ) : previewError ? (
                    <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                        {previewError}
                    </p>
                ) : preview ? (
                    <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                            {preview.source}
                        </p>
                        <ul className="space-y-2">
                            {preview.semis.map((sf) => (
                                <li
                                    key={sf.slot}
                                    className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                                >
                                    <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        {sf.slot}
                                    </span>
                                    <span className="flex-1 truncate text-right">
                                        {sf.team_a ?? 'TBD'}{' '}
                                        <span className="text-muted-foreground">
                                            vs
                                        </span>{' '}
                                        {sf.team_b ?? 'TBD'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-xs text-muted-foreground">
                            The bronze and final slots stay empty until each
                            semifinal finalizes.
                        </p>
                    </div>
                ) : null}

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost" disabled={submitting}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        onClick={confirmGenerate}
                        disabled={
                            submitting ||
                            loadingPreview ||
                            !!previewError ||
                            !preview
                        }
                    >
                        {submitting ? 'Generating…' : 'Generate bracket'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function BracketSummary({ bracket }: { bracket: NonNullable<BracketPayload> }) {
    return (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {bracket.semis.map((semi, idx) => (
                <BracketMiniCard
                    key={semi.id}
                    label={`Semifinal ${idx + 1}`}
                    match={semi}
                />
            ))}
            {bracket.final && (
                <BracketMiniCard
                    label="Championship"
                    match={bracket.final}
                    accent="champion"
                    icon={<Crown className="h-3.5 w-3.5" />}
                />
            )}
            {bracket.bronze && (
                <BracketMiniCard
                    label="Battle for 3rd"
                    match={bracket.bronze}
                    accent="bronze"
                    icon={<Medal className="h-3.5 w-3.5" />}
                />
            )}
        </div>
    );
}

function BracketMiniCard({
    label,
    match,
    accent,
    icon,
}: {
    label: string;
    match: BracketMatchPayload;
    accent?: 'champion' | 'bronze';
    icon?: React.ReactNode;
}) {
    const teamA = match.team_a?.display_name ?? 'TBD';
    const teamB = match.team_b?.display_name ?? 'TBD';
    const aWon =
        match.winner_team_id !== null &&
        match.winner_team_id === match.team_a?.id;
    const bWon =
        match.winner_team_id !== null &&
        match.winner_team_id === match.team_b?.id;

    return (
        <div
            className={cn(
                'overflow-hidden rounded-lg border bg-card',
                accent === 'champion' &&
                    'border-amber-500/40 bg-amber-500/5',
                accent === 'bronze' && 'border-orange-500/30',
            )}
        >
            <div className="flex items-center gap-1.5 border-b bg-muted/40 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                {icon}
                {label}
            </div>
            <div className="divide-y text-sm">
                <div
                    className={cn(
                        'flex items-center justify-between gap-2 px-3 py-1.5',
                        aWon && 'bg-emerald-500/10 font-semibold',
                    )}
                >
                    <span className="truncate">{teamA}</span>
                    <span className="tabular-nums text-muted-foreground">
                        {match.score_a ?? '—'}
                    </span>
                </div>
                <div
                    className={cn(
                        'flex items-center justify-between gap-2 px-3 py-1.5',
                        bWon && 'bg-emerald-500/10 font-semibold',
                    )}
                >
                    <span className="truncate">{teamB}</span>
                    <span className="tabular-nums text-muted-foreground">
                        {match.score_b ?? '—'}
                    </span>
                </div>
            </div>
        </div>
    );
}

function PoolBlock({
    pool,
    tournamentSlug,
    categoryId,
    unassignedTeams,
    rrPoints,
    availableUmpires,
    canManage,
}: {
    pool: ScoringPool;
    tournamentSlug: string;
    categoryId: string;
    unassignedTeams: ScoringTeam[];
    rrPoints: number;
    availableUmpires: ScoringUmpire[];
    canManage: boolean;
}) {
    const allMatches = pool.matches.length;
    const completedMatches = pool.matches.filter(
        (m) => m.score_a !== null && m.score_b !== null,
    ).length;

    const availableTeamsForEdit = useMemo(
        () => [...pool.teams, ...unassignedTeams],
        [pool.teams, unassignedTeams],
    );

    const handleGenerate = () => {
        router.post(
            PoolController.generate({
                tournament: tournamentSlug,
                category: categoryId,
                pool: pool.id,
            }).url,
            {},
            { preserveScroll: true },
        );
    };

    const handleDelete = () => {
        if (
            !window.confirm(
                `Delete pool "${pool.name}"? Teams will be unassigned and matches removed.`,
            )
        ) {
            return;
        }
        router.delete(
            PoolController.destroy({
                tournament: tournamentSlug,
                category: categoryId,
                pool: pool.id,
            }).url,
            { preserveScroll: true },
        );
    };

    return (
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-5 py-3">
                <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Trophy className="h-4 w-4" />
                    </span>
                    <div>
                        <h2 className="font-semibold leading-tight">
                            {pool.name}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {pool.teams.length} teams · {completedMatches}/
                            {allMatches} matches played
                        </p>
                    </div>
                </div>
                {canManage && (
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleGenerate}
                            disabled={pool.teams.length < 2}
                        >
                            <Wand2 className="h-4 w-4" />
                            {allMatches === 0
                                ? 'Generate matches'
                                : 'Refresh matches'}
                        </Button>
                        <PoolFormDialog
                            mode="edit"
                            tournament={tournamentSlug}
                            category={categoryId}
                            pool={pool}
                            availableTeams={availableTeamsForEdit}
                            initialSelectedIds={pool.teams.map((t) => t.id)}
                        >
                            <Button size="sm" variant="ghost">
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </PoolFormDialog>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleDelete}
                            aria-label="Delete pool"
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                )}
            </header>

            <div className="grid gap-5 p-5 lg:grid-cols-[1.4fr_1fr]">
                <div className="space-y-3">
                    <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Matches
                    </h3>
                    {pool.matches.length === 0 ? (
                        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                            {pool.teams.length < 2
                                ? 'Assign at least two teams, then generate matches.'
                                : 'Click "Generate matches" to create the round-robin schedule.'}
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {pool.matches.map((match) => (
                                <MatchRow
                                    key={match.id}
                                    match={match}
                                    tournamentSlug={tournamentSlug}
                                    categoryId={categoryId}
                                    maxScore={rrPoints + 10}
                                    availableUmpires={availableUmpires}
                                    canManage={canManage}
                                />
                            ))}
                        </ul>
                    )}
                </div>

                <div className="space-y-3">
                    <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Standings
                    </h3>
                    {pool.standings.length === 0 ? (
                        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                            No teams in this pool.
                        </div>
                    ) : (
                        <StandingsTable standings={pool.standings} />
                    )}
                </div>
            </div>
        </section>
    );
}

function StandingsTable({
    standings,
}: {
    standings: ScoringPool['standings'];
}) {
    return (
        <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                    <tr>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Team</th>
                        <th className="px-3 py-2 text-right">W</th>
                        <th className="px-3 py-2 text-right">L</th>
                        <th className="px-3 py-2 text-right">+/-</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {standings.map((row) => (
                        <tr key={row.team_id}>
                            <td className="px-3 py-2 font-semibold">
                                {row.rank}
                            </td>
                            <td className="px-3 py-2">{row.display_name}</td>
                            <td className="px-3 py-2 text-right font-medium text-primary">
                                {row.wins}
                            </td>
                            <td className="px-3 py-2 text-right text-muted-foreground">
                                {row.losses}
                            </td>
                            <td
                                className={cn(
                                    'px-3 py-2 text-right tabular-nums',
                                    row.point_diff > 0 && 'text-primary',
                                    row.point_diff < 0 && 'text-destructive',
                                    row.point_diff === 0 &&
                                        'text-muted-foreground',
                                )}
                            >
                                {row.point_diff > 0 ? '+' : ''}
                                {row.point_diff}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function MatchRow({
    match,
    tournamentSlug,
    categoryId,
    maxScore,
    availableUmpires,
    canManage,
}: {
    match: ScoringMatch;
    tournamentSlug: string;
    categoryId: string;
    maxScore: number;
    availableUmpires: ScoringUmpire[];
    canManage: boolean;
}) {
    const [editing, setEditing] = useState(
        match.score_a === null || match.score_b === null,
    );

    const form = useForm({
        score_a: match.score_a ?? '',
        score_b: match.score_b ?? '',
    });

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        form.patch(
            MatchController.update({
                tournament: tournamentSlug,
                category: categoryId,
                match: match.id,
            }).url,
            {
                preserveScroll: true,
                onSuccess: () => setEditing(false),
            },
        );
    };

    const handleReset = () => {
        router.delete(
            MatchController.reset({
                tournament: tournamentSlug,
                category: categoryId,
                match: match.id,
            }).url,
            {
                preserveScroll: true,
                onSuccess: () => {
                    form.setData('score_a', '');
                    form.setData('score_b', '');
                    setEditing(true);
                },
            },
        );
    };

    const teamLabel = (side: 'a' | 'b') => {
        const team = side === 'a' ? match.team_a : match.team_b;
        if (!team) return 'TBD';
        const isWinner = match.winner_team_id === team.id;
        return (
            <span
                className={cn(
                    'flex items-center gap-1.5',
                    isWinner && 'font-semibold text-primary',
                )}
            >
                {isWinner && <Check className="h-3.5 w-3.5" />}
                {team.display_name}
            </span>
        );
    };

    const recorded = match.score_a !== null && match.score_b !== null;

    return (
        <li className="rounded-lg border bg-background p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>Game {match.sequence}</span>
                <div className="flex flex-wrap items-center gap-2">
                    {canManage && (
                        <CourtAssign
                            tournamentSlug={tournamentSlug}
                            categoryId={categoryId}
                            matchId={match.id}
                            initialCourtNumber={match.court_number}
                        />
                    )}
                    {!canManage && match.court_number !== null && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                            Court {match.court_number}
                        </span>
                    )}
                    {canManage && (
                        <UmpireAssign
                            tournamentSlug={tournamentSlug}
                            categoryId={categoryId}
                            matchId={match.id}
                            assigned={match.assigned_umpire}
                            availableUmpires={availableUmpires}
                        />
                    )}
                    {!canManage && match.assigned_umpire && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                            Umpire: {match.assigned_umpire.name}
                        </span>
                    )}
                    {recorded && !editing && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            Recorded
                        </span>
                    )}
                </div>
            </div>

            {!editing && recorded ? (
                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 space-y-1 text-sm">
                        <div className="flex items-center justify-between gap-2">
                            {teamLabel('a')}
                            <span className="font-semibold tabular-nums">
                                {match.score_a}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            {teamLabel('b')}
                            <span className="font-semibold tabular-nums">
                                {match.score_b}
                            </span>
                        </div>
                    </div>
                    {canManage && (
                        <div className="flex flex-col gap-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditing(true)}
                                aria-label="Edit score"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleReset}
                                aria-label="Reset score"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <form
                    onSubmit={submit}
                    className="space-y-2"
                >
                    <ScoreInputRow
                        label={teamLabel('a')}
                        name="score_a"
                        value={form.data.score_a}
                        onChange={(v) => form.setData('score_a', v)}
                        max={maxScore}
                        error={form.errors.score_a}
                        disabled={!canManage}
                    />
                    <ScoreInputRow
                        label={teamLabel('b')}
                        name="score_b"
                        value={form.data.score_b}
                        onChange={(v) => form.setData('score_b', v)}
                        max={maxScore}
                        error={form.errors.score_b}
                        disabled={!canManage}
                    />
                    {canManage && (
                        <div className="flex justify-end gap-2 pt-1">
                            {recorded && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditing(false)}
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button
                                type="submit"
                                size="sm"
                                disabled={form.processing}
                            >
                                {form.processing ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Check className="h-3.5 w-3.5" />
                                )}
                                Save score
                            </Button>
                        </div>
                    )}
                </form>
            )}
        </li>
    );
}

function CourtAssign({
    tournamentSlug,
    categoryId,
    matchId,
    initialCourtNumber,
}: {
    tournamentSlug: string;
    categoryId: string;
    matchId: string;
    initialCourtNumber: string | null;
}) {
    const [value, setValue] = useState<string>(initialCourtNumber ?? '');
    const [saving, setSaving] = useState(false);

    const save = () => {
        const trimmed = value.trim();
        const next = trimmed === '' ? null : trimmed;
        if ((initialCourtNumber ?? '') === (next ?? '')) {
            return;
        }
        setSaving(true);
        router.patch(
            MatchController.assign({
                tournament: tournamentSlug,
                category: categoryId,
                match: matchId,
            }).url,
            { court_number: next },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-2 py-0.5">
            <span className="text-[10px] font-medium text-muted-foreground">
                Court
            </span>
            <input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={save}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        (e.target as HTMLInputElement).blur();
                    }
                }}
                placeholder="—"
                maxLength={16}
                disabled={saving}
                aria-label="Court number"
                className="w-12 border-0 bg-transparent p-0 text-center text-[11px] font-semibold tabular-nums outline-none placeholder:text-muted-foreground/50 focus:ring-0"
            />
        </span>
    );
}

function UmpireAssign({
    tournamentSlug,
    categoryId,
    matchId,
    assigned,
    availableUmpires,
}: {
    tournamentSlug: string;
    categoryId: string;
    matchId: string;
    assigned: { id: string; name: string } | null;
    availableUmpires: ScoringUmpire[];
}) {
    const [saving, setSaving] = useState(false);

    const save = (value: string) => {
        const next = value === '' ? null : value;
        if ((assigned?.id ?? '') === (next ?? '')) {
            return;
        }
        setSaving(true);
        router.patch(
            MatchController.assignUmpire({
                tournament: tournamentSlug,
                category: categoryId,
                match: matchId,
            }).url,
            { assigned_umpire_user_id: next },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-2 py-0.5">
            <span className="text-[10px] font-medium text-muted-foreground">
                Umpire
            </span>
            <select
                value={assigned?.id ?? ''}
                onChange={(e) => save(e.target.value)}
                disabled={saving}
                aria-label="Assigned umpire"
                className="max-w-[12rem] truncate border-0 bg-transparent p-0 text-[11px] font-semibold outline-none focus:ring-0"
            >
                <option value="">— Unassigned —</option>
                {availableUmpires.map((u) => (
                    <option key={u.id} value={u.id}>
                        {u.name}
                    </option>
                ))}
            </select>
        </span>
    );
}

function ScoreInputRow({
    label,
    name,
    value,
    onChange,
    max,
    error,
    disabled,
}: {
    label: React.ReactNode;
    name: string;
    value: string | number;
    onChange: (next: string) => void;
    max: number;
    error?: string;
    disabled: boolean;
}) {
    return (
        <div>
            <div className="flex items-center justify-between gap-2">
                <Label htmlFor={name} className="text-sm font-normal">
                    {label}
                </Label>
                <Input
                    id={name}
                    name={name}
                    type="number"
                    min={0}
                    max={max}
                    inputMode="numeric"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="h-8 w-20 text-right"
                />
            </div>
            <InputError message={error} />
        </div>
    );
}

function PoolFormDialog({
    mode,
    tournament,
    category,
    pool,
    availableTeams,
    initialSelectedIds,
    children,
}: {
    mode: 'create' | 'edit';
    tournament: string;
    category: string;
    pool?: ScoringPool;
    availableTeams: ScoringTeam[];
    initialSelectedIds: string[];
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);

    const action =
        mode === 'edit' && pool
            ? PoolController.update.form({
                  tournament,
                  category,
                  pool: pool.id,
              })
            : PoolController.store.form({ tournament, category });

    const [name, setName] = useState(pool?.name ?? '');
    const [selected, setSelected] = useState<string[]>(initialSelectedIds);

    const reset = (next: boolean) => {
        setOpen(next);
        if (next) {
            setName(pool?.name ?? '');
            setSelected(initialSelectedIds);
        }
    };

    const toggle = (id: string, checked: boolean) => {
        setSelected((prev) =>
            checked ? [...prev, id] : prev.filter((x) => x !== id),
        );
    };

    return (
        <Dialog open={open} onOpenChange={reset}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                className="sm:max-w-md"
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <Form
                    key={String(open)}
                    {...action}
                    transform={(data) => ({
                        ...data,
                        name,
                        teams: selected,
                    })}
                    onSuccess={() => setOpen(false)}
                    className="space-y-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    {mode === 'edit'
                                        ? 'Edit pool'
                                        : 'New pool'}
                                </DialogTitle>
                                <DialogDescription>
                                    Group the teams that will play their
                                    round-robin matches together.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-2">
                                <Label htmlFor="pool-name">Name</Label>
                                <Input
                                    id="pool-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="e.g., Bracket A"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Teams</Label>
                                {availableTeams.length === 0 ? (
                                    <div className="rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
                                        <ShieldQuestion className="mb-1 h-4 w-4" />
                                        No teams available. Register teams or
                                        move them from other pools.
                                    </div>
                                ) : (
                                    <ul className="max-h-60 space-y-1 overflow-auto rounded-md border bg-background p-2">
                                        {availableTeams.map((team) => (
                                            <li
                                                key={team.id}
                                                className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/40"
                                            >
                                                <Checkbox
                                                    id={`team-${team.id}`}
                                                    checked={selected.includes(
                                                        team.id,
                                                    )}
                                                    onCheckedChange={(c) =>
                                                        toggle(
                                                            team.id,
                                                            c === true,
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor={`team-${team.id}`}
                                                    className="flex-1 cursor-pointer"
                                                >
                                                    {team.display_name}
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <InputError message={errors.teams} />
                            </div>

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary" type="button">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {mode === 'edit' ? 'Save' : 'Create pool'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

ScoringShow.layout = (props: ScoringShowProps) => ({
    breadcrumbs: [
        { title: 'Scoring', href: scoringIndex().url },
        {
            title: props.tournament.name,
            href: tournamentShow(props.tournament.slug).url,
        },
        {
            title: props.category.name,
            href: `/tournaments/${props.tournament.slug}/categories/${props.category.id}/scoring`,
        },
    ],
});
