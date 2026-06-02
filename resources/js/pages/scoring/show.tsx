import { Form, Head, Link, router, useForm } from '@inertiajs/react';
import {
    BookOpen,
    Check,
    ChevronLeft,
    Loader2,
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

                <FormatRules
                    format={category.format}
                    rrPoints={category.rr_points_to_win}
                    elimPoints={category.elim_points_to_win}
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

function PoolBlock({
    pool,
    tournamentSlug,
    categoryId,
    unassignedTeams,
    rrPoints,
    canManage,
}: {
    pool: ScoringPool;
    tournamentSlug: string;
    categoryId: string;
    unassignedTeams: ScoringTeam[];
    rrPoints: number;
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
    canManage,
}: {
    match: ScoringMatch;
    tournamentSlug: string;
    categoryId: string;
    maxScore: number;
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
            <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>Match {match.sequence}</span>
                {recorded && !editing && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Recorded
                    </span>
                )}
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
