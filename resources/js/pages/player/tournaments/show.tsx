import { Form, Head, Link } from '@inertiajs/react';
import {
    AlarmClock,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Link2,
    MapPin,
    Ticket,
    Trophy,
    Users,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import PlayerTournamentController from '@/actions/App/Http/Controllers/Player/TournamentController';
import InputError from '@/components/input-error';
import VenueMapPreview from '@/components/venue-map-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatPeso as formatFee } from '@/lib/money';
import { cn } from '@/lib/utils';
import { index, show } from '@/routes/player/tournaments';
import type {
    PlayerExistingTeam,
    PlayerTournamentCategory,
    PlayerTournamentShowProps,
    PlayerTournamentSummary,
} from '@/types';

const scoringText = (category: PlayerTournamentCategory): string => {
    if (category.format === 'round_robin') {
        return `Round robin to ${category.rr_points_to_win}`;
    }
    if (category.format === 'single_elimination') {
        return `Elimination to ${category.elim_points_to_win}`;
    }
    return `RR to ${category.rr_points_to_win} · Elim to ${category.elim_points_to_win}`;
};

const formatLongDate = (iso: string | null): string | null => {
    if (!iso) return null;
    const date = new Date(iso.replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const dateRange = (startsAt: string | null, endsAt: string | null): string => {
    const s = formatLongDate(startsAt);
    const e = formatLongDate(endsAt);
    if (s && e && s === e) return s;
    if (s && e) return `${s} – ${e}`;
    return s ?? e ?? 'Dates TBA';
};

export default function PlayerTournamentShow({
    tournament,
    heis,
    auth,
    existingTeams,
}: PlayerTournamentShowProps) {
    // Skill level the player is locked into for this tournament (if any).
    const lockedSkillLevel = existingTeams[0]?.category_skill_level ?? null;
    const registeredCategoryIds = useMemo(
        () => new Set(existingTeams.map((t) => t.category_id)),
        [existingTeams],
    );

    // Categories the player can still register in: not full, not already
    // registered, and (if locked) skill level matches the existing teams'.
    const availableCategories = useMemo(
        () =>
            tournament.categories.filter((c) => {
                if (c.is_full) return false;
                if (registeredCategoryIds.has(c.id.toString())) return false;
                if (
                    lockedSkillLevel !== null &&
                    c.skill_level !== lockedSkillLevel
                )
                    return false;
                return true;
            }),
        [tournament.categories, registeredCategoryIds, lockedSkillLevel],
    );

    const [categoryId, setCategoryId] = useState<string>(
        availableCategories[0]?.id?.toString() ?? '',
    );
    const [heiId, setHeiId] = useState<string>('');
    const [mode, setMode] = useState<'pair' | 'solo'>('pair');
    const selectedCategory = tournament.categories.find(
        (category) => category.id.toString() === categoryId,
    );

    const totalCategories = tournament.categories.length;
    const minFee = (() => {
        const fees = tournament.categories
            .map((c) => c.registration_fee)
            .filter((f): f is number => f !== null);
        return fees.length === 0 ? null : Math.min(...fees);
    })();

    return (
        <>
            <Head title={`Register – ${tournament.name}`} />

            <div className="space-y-4 px-4 pb-28 sm:pb-6">
                {/* ─── Hero (full width, like admin) ─── */}
                <HeroCard
                    tournament={tournament}
                    totalCategories={totalCategories}
                    minFee={minFee}
                />

                {/* ─── About + Map row (only when there's something to show) ─── */}
                {(tournament.description ||
                    (tournament.venue_lat !== null &&
                        tournament.venue_lng !== null)) && (
                    <section className="grid gap-4 lg:grid-cols-12">
                        {tournament.description && (
                            <AboutCard
                                description={tournament.description}
                                className="lg:col-span-8"
                            />
                        )}
                        {tournament.venue_lat !== null &&
                            tournament.venue_lng !== null && (
                                <VenuePanel
                                    lat={tournament.venue_lat}
                                    lng={tournament.venue_lng}
                                    className={
                                        tournament.description
                                            ? 'lg:col-span-4'
                                            : 'lg:col-span-12'
                                    }
                                />
                            )}
                    </section>
                )}

                {/* ─── Existing registrations ─── */}
                {existingTeams.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            Your registrations ({existingTeams.length})
                        </h2>
                        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(22rem,1fr))]">
                            {existingTeams.map((team) => (
                                <RegisteredTeamCard
                                    key={team.id}
                                    team={team}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* ─── Accept partner invite ─── */}
                <AcceptInvitePanel tournamentSlug={tournament.slug} />

                {/* ─── Categories + Form row (if more eligible categories remain) ─── */}
                {availableCategories.length === 0 ? (
                    existingTeams.length === 0 && <EmptyState />
                ) : (
                    <section className="grid gap-4 lg:grid-cols-12">
                        <div className="lg:col-span-7">
                            <CategoryPickerSection
                                categories={tournament.categories}
                                registeredCategoryIds={registeredCategoryIds}
                                lockedSkillLevel={lockedSkillLevel}
                                selectedId={categoryId}
                                onSelect={setCategoryId}
                                hasExistingTeams={existingTeams.length > 0}
                            />
                        </div>
                        <div className="lg:col-span-5">
                            <RegistrationForm
                                tournament={tournament}
                                heis={heis}
                                auth={auth}
                                categoryId={categoryId}
                                heiId={heiId}
                                setHeiId={setHeiId}
                                mode={mode}
                                setMode={setMode}
                                selectedCategory={selectedCategory}
                            />
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}

function HeroCard({
    tournament,
    totalCategories,
    minFee,
}: {
    tournament: PlayerTournamentSummary;
    totalCategories: number;
    minFee: number | null;
}) {
    return (
        <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-sm">
            <div className="flex flex-col gap-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-accent uppercase">
                            <Trophy className="h-3 w-3" />
                            Registration open
                        </span>
                        <h1 className="text-xl font-bold leading-tight sm:text-2xl">
                            {tournament.name}
                        </h1>
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-primary-foreground/85 sm:text-sm">
                            {tournament.organizer_name && (
                                <span className="flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5" />
                                    {tournament.organizer_name}
                                </span>
                            )}
                            {tournament.venue && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5" />
                                    <span className="line-clamp-1">
                                        {tournament.venue}
                                    </span>
                                </span>
                            )}
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {dateRange(
                                    tournament.starts_at,
                                    tournament.ends_at,
                                )}
                            </span>
                            {tournament.registration_deadline && (
                                <DeadlineRow
                                    iso={tournament.registration_deadline}
                                />
                            )}
                        </div>
                    </div>
                    <Button
                        asChild
                        variant="secondary"
                        size="sm"
                        className="h-8"
                    >
                        <Link href={index().url}>← Back</Link>
                    </Button>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:max-w-md">
                    <StatTile
                        label="Categories"
                        value={totalCategories.toString()}
                    />
                    <StatTile
                        label="Fee from"
                        value={minFee === null ? 'Free' : formatFee(minFee)}
                    />
                    <StatTile
                        label="Status"
                        value={
                            tournament.registration_open === false
                                ? 'Closed'
                                : 'Open'
                        }
                    />
                </div>
            </div>
        </section>
    );
}

function StatTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl bg-primary-foreground/10 p-3 backdrop-blur">
            <div className="text-[10px] font-medium tracking-wide text-primary-foreground/70 uppercase">
                {label}
            </div>
            <div className="mt-1 text-base font-bold sm:text-lg">{value}</div>
        </div>
    );
}

function VenuePanel({
    lat,
    lng,
    className,
}: {
    lat: number;
    lng: number;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex min-h-[22rem] flex-col overflow-hidden rounded-2xl border bg-card shadow-sm',
                className,
            )}
        >
            <div className="flex items-center justify-between border-b px-5 py-3">
                <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                    Venue
                </h2>
                <a
                    href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-primary hover:underline"
                >
                    Open in maps
                </a>
            </div>
            <VenueMapPreview
                lat={lat}
                lng={lng}
                className="w-full flex-1"
            />
        </div>
    );
}

function DeadlineRow({ iso }: { iso: string }) {
    const date = new Date(iso);
    const past = date.getTime() < Date.now();
    const hoursLeft = Math.max(
        0,
        Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60)),
    );
    const urgent = !past && hoursLeft <= 48;

    const formatted = date.toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });

    return (
        <div
            className={cn(
                'flex items-center gap-1.5',
                (past || urgent) && 'font-semibold text-accent',
            )}
        >
            <AlarmClock className="h-3.5 w-3.5" />
            Register by {formatted}
            {urgent && !past && (
                <span className="ml-1 text-[10px]">
                    ({hoursLeft}h left)
                </span>
            )}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="rounded-2xl border border-dashed bg-card p-8 text-center">
            <Trophy className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No open categories</p>
            <p className="mt-1 text-xs text-muted-foreground">
                Every category is full. Check back later or browse other
                tournaments.
            </p>
        </div>
    );
}

function AboutCard({
    description,
    className,
}: {
    description: string;
    className?: string;
}) {
    const [expanded, setExpanded] = useState(false);
    const [overflowing, setOverflowing] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        setOverflowing(ref.current.scrollHeight - ref.current.clientHeight > 4);
    }, [description, expanded]);

    return (
        <section
            className={cn(
                'flex min-h-[22rem] flex-col rounded-2xl border bg-card p-5 shadow-sm',
                className,
            )}
        >
            <h2 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                About this tournament
            </h2>
            <div
                ref={ref}
                className={cn(
                    'prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2',
                    !expanded && 'line-clamp-[10]',
                )}
                dangerouslySetInnerHTML={{ __html: description }}
            />
            {(overflowing || expanded) && (
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                    {expanded ? (
                        <>
                            <ChevronUp className="h-3 w-3" /> See less
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-3 w-3" /> See more
                        </>
                    )}
                </button>
            )}
        </section>
    );
}

function AcceptInvitePanel({ tournamentSlug }: { tournamentSlug: string }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <section className="rounded-2xl border bg-card shadow-sm">
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5"
                aria-expanded={expanded}
            >
                <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-primary/10 p-2 text-primary">
                        <Ticket className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-sm font-semibold">
                            Have a partner invite link?
                        </h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Paste the link you received to join an existing team
                            as Player 2.
                        </p>
                    </div>
                </div>
                {expanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
            </button>

            {expanded && (
                <div className="border-t px-4 py-4 sm:px-5">
                    <Form
                        {...PlayerTournamentController.acceptInvite.form(
                            tournamentSlug,
                        )}
                        resetOnSuccess
                        className="space-y-3"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="partner-invite">
                                        Invite link or token
                                    </Label>
                                    <Input
                                        id="partner-invite"
                                        name="partner_invite"
                                        type="text"
                                        autoComplete="off"
                                        placeholder="https://…/join/abc123 or paste token"
                                        required
                                    />
                                    <InputError
                                        message={errors.partner_invite}
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        size="sm"
                                    >
                                        {processing
                                            ? 'Joining…'
                                            : 'Join as Player 2'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            )}
        </section>
    );
}

function CategoryPickerSection({
    categories,
    registeredCategoryIds,
    lockedSkillLevel,
    selectedId,
    onSelect,
    hasExistingTeams,
}: {
    categories: PlayerTournamentCategory[];
    registeredCategoryIds: Set<string>;
    lockedSkillLevel: string | null;
    selectedId: string;
    onSelect: (id: string) => void;
    hasExistingTeams: boolean;
}) {
    const lockedLabel = lockedSkillLevel
        ? categories.find((c) => c.skill_level === lockedSkillLevel)
              ?.skill_level_label
        : null;

    return (
        <section className="space-y-3 rounded-2xl border bg-card p-4 sm:p-5">
            <div>
                <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                    {hasExistingTeams
                        ? 'Register in another category'
                        : 'Pick your category'}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    {lockedLabel
                        ? `You're locked to ${lockedLabel} categories — different divisions are okay (e.g. Men's + Mixed), different skill levels are not.`
                        : 'You can play across divisions of the same skill level (e.g. Men\'s + Mixed). Different skill levels are not allowed.'}
                </p>
            </div>
            <div className="space-y-2">
                {categories.map((c) => {
                    const alreadyRegistered = registeredCategoryIds.has(
                        c.id.toString(),
                    );
                    const wrongSkill =
                        lockedSkillLevel !== null &&
                        c.skill_level !== lockedSkillLevel;
                    return (
                        <CategoryPick
                            key={c.id}
                            category={c}
                            selected={c.id.toString() === selectedId}
                            alreadyRegistered={alreadyRegistered}
                            wrongSkill={wrongSkill}
                            onSelect={() => {
                                if (
                                    !c.is_full &&
                                    !alreadyRegistered &&
                                    !wrongSkill
                                ) {
                                    onSelect(c.id.toString());
                                }
                            }}
                        />
                    );
                })}
            </div>
        </section>
    );
}

function CategoryPick({
    category,
    selected,
    alreadyRegistered,
    wrongSkill,
    onSelect,
}: {
    category: PlayerTournamentCategory;
    selected: boolean;
    alreadyRegistered: boolean;
    wrongSkill: boolean;
    onSelect: () => void;
}) {
    const disabled = category.is_full || alreadyRegistered || wrongSkill;

    return (
        <button
            type="button"
            onClick={onSelect}
            disabled={disabled}
            className={cn(
                'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                selected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:bg-muted/30',
                disabled && 'cursor-not-allowed opacity-60',
            )}
        >
            <span
                className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    selected
                        ? 'border-primary bg-primary'
                        : alreadyRegistered
                          ? 'border-primary/40 bg-primary/10'
                          : 'border-border bg-background',
                )}
            >
                {selected && (
                    <span className="h-2 w-2 rounded-full bg-primary-foreground" />
                )}
                {alreadyRegistered && !selected && (
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                )}
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-medium leading-tight">
                        {category.name}
                    </span>
                    {alreadyRegistered ? (
                        <Badge
                            variant="secondary"
                            className="bg-primary/10 text-[10px] text-primary"
                        >
                            Registered
                        </Badge>
                    ) : wrongSkill ? (
                        <Badge
                            variant="outline"
                            className="text-[10px] text-muted-foreground"
                        >
                            Different skill level
                        </Badge>
                    ) : (
                        <Badge
                            variant={
                                category.is_full ? 'outline' : 'secondary'
                            }
                            className="text-[10px]"
                        >
                            {category.is_full
                                ? 'Full'
                                : `${category.registered_teams}${category.max_teams !== null ? `/${category.max_teams}` : ''}`}
                        </Badge>
                    )}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                    {category.division_label} · {category.skill_level_label} ·{' '}
                    {scoringText(category)}
                </div>
                <div className="mt-1 text-xs font-medium text-foreground">
                    {formatFee(category.registration_fee)}
                </div>
            </div>
        </button>
    );
}

function RegistrationForm({
    tournament,
    heis,
    auth,
    categoryId,
    heiId,
    setHeiId,
    mode,
    setMode,
    selectedCategory,
}: {
    tournament: PlayerTournamentSummary;
    heis: PlayerTournamentShowProps['heis'];
    auth: PlayerTournamentShowProps['auth'];
    categoryId: string;
    heiId: string;
    setHeiId: (v: string) => void;
    mode: 'pair' | 'solo';
    setMode: (m: 'pair' | 'solo') => void;
    selectedCategory: PlayerTournamentCategory | undefined;
}) {
    return (
        <Form
            {...PlayerTournamentController.store.form(tournament.slug)}
            className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-5"
            transform={(data) => ({
                ...data,
                category_id: categoryId,
                hei_id: heiId === '' ? null : heiId,
                registration_mode: mode,
            })}
        >
            {({ errors, processing }) => (
                <>
                    <div>
                        <h2 className="text-base font-semibold">Your team</h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Signed in as{' '}
                            <span className="font-medium text-foreground">
                                {auth.user.name}
                            </span>
                            . You are Player 1.
                        </p>
                    </div>

                    {selectedCategory && (
                        <div className="rounded-xl border bg-muted/30 p-3">
                            <div className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                Selected
                            </div>
                            <div className="mt-0.5 font-semibold">
                                {selectedCategory.name}
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                                {formatFee(selectedCategory.registration_fee)}
                            </div>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label>Affiliation (optional)</Label>
                        <Select value={heiId} onValueChange={setHeiId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="No affiliation" />
                            </SelectTrigger>
                            <SelectContent>
                                {heis.map((hei) => (
                                    <SelectItem
                                        key={hei.id}
                                        value={hei.id.toString()}
                                    >
                                        {hei.name}
                                        {hei.abbreviation
                                            ? ` (${hei.abbreviation})`
                                            : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.hei_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="captain-phone">Your phone</Label>
                        <Input
                            id="captain-phone"
                            name="captain_phone"
                            type="tel"
                            inputMode="tel"
                            placeholder="09xx xxx xxxx"
                        />
                        <InputError message={errors.captain_phone} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Partner registration</Label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <ModeButton
                                active={mode === 'pair'}
                                onClick={() => setMode('pair')}
                                icon={<Users className="h-4 w-4" />}
                                title="Register as a pair"
                                subtitle="Add Player 2 now"
                            />
                            <ModeButton
                                active={mode === 'solo'}
                                onClick={() => setMode('solo')}
                                icon={<Link2 className="h-4 w-4" />}
                                title="Invite later"
                                subtitle="Get a shareable link"
                            />
                        </div>
                    </div>

                    {mode === 'pair' ? (
                        <div className="space-y-3">
                            <div className="grid gap-2">
                                <Label htmlFor="partner-name">
                                    Player 2 name *
                                </Label>
                                <Input
                                    id="partner-name"
                                    name="partner_name"
                                    required
                                    placeholder="Player 2 full name"
                                />
                                <InputError message={errors.partner_name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="partner-email">
                                    Player 2 email (optional)
                                </Label>
                                <Input
                                    id="partner-email"
                                    name="partner_email"
                                    type="email"
                                    inputMode="email"
                                    placeholder="player2@example.com"
                                />
                                <InputError message={errors.partner_email} />
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            <Label htmlFor="partner-email-hint">
                                Partner email (optional)
                            </Label>
                            <Input
                                id="partner-email-hint"
                                name="partner_email"
                                type="email"
                                inputMode="email"
                                placeholder="partner@example.com"
                            />
                            <p className="text-xs text-muted-foreground">
                                We'll include it in the invite link for
                                reference.
                            </p>
                            <InputError message={errors.partner_email} />
                        </div>
                    )}

                    {/* Sticky CTA on mobile, inline submit on desktop */}
                    <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 p-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0">
                        <div className="flex items-center justify-between gap-3 px-4 lg:px-0">
                            {selectedCategory && (
                                <div className="text-xs text-muted-foreground lg:hidden">
                                    <div className="font-medium text-foreground">
                                        {selectedCategory.name}
                                    </div>
                                    {formatFee(
                                        selectedCategory.registration_fee,
                                    )}
                                </div>
                            )}
                            <Button
                                type="submit"
                                disabled={processing || !categoryId}
                                className="ml-auto h-11 px-6 lg:h-9 lg:w-full"
                            >
                                Submit registration
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </Form>
    );
}

function ModeButton({
    active,
    onClick,
    icon,
    title,
    subtitle,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex flex-1 items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors',
                active
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:bg-muted/30',
            )}
        >
            <span className="shrink-0 text-muted-foreground">{icon}</span>
            <span className="min-w-0">
                <span className="block font-medium leading-tight">
                    {title}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                    {subtitle}
                </span>
            </span>
        </button>
    );
}

function RegisteredTeamCard({ team }: { team: PlayerExistingTeam }) {
    const [copied, setCopied] = useState(false);
    const inviteUrl = team.partner_token
        ? `${window.location.origin}/join/${team.partner_token}`
        : null;

    const copyInviteLink = () => {
        if (!inviteUrl) return;
        navigator.clipboard.writeText(inviteUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const placeholderPartner = team.players.find((p) => p.is_placeholder);

    return (
        <section className="space-y-3 rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">You're registered!</span>
            </div>
            <div className="text-sm text-muted-foreground">
                Category:{' '}
                <span className="font-medium text-foreground">
                    {team.category_name}
                </span>
            </div>
            {team.hei_name && (
                <div className="text-sm text-muted-foreground">
                    Affiliation:{' '}
                    <span className="font-medium text-foreground">
                        {team.hei_name}
                    </span>
                </div>
            )}
            <div className="space-y-2">
                {team.players.map((p, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                    >
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{p.display_name}</span>
                        <Badge variant="secondary" className="text-[10px]">
                            {p.is_captain ? 'Player 1' : 'Player 2'}
                        </Badge>
                        {p.is_placeholder && (
                            <Badge
                                variant="outline"
                                className="text-[10px] text-muted-foreground"
                            >
                                Not yet claimed
                            </Badge>
                        )}
                    </div>
                ))}
            </div>

            {inviteUrl && (
                <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
                        <Link2 className="h-4 w-4" />
                        {placeholderPartner
                            ? `Invite ${placeholderPartner.display_name}`
                            : 'Invite your partner'}
                    </div>
                    <p className="mb-2 text-xs text-muted-foreground">
                        {placeholderPartner
                            ? 'Share this link so they can sign in (or create an account) and link to your team.'
                            : 'Share this link so your partner can join the team.'}
                    </p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 overflow-hidden rounded bg-background px-2 py-1.5 text-xs whitespace-nowrap text-ellipsis">
                            {inviteUrl}
                        </code>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={copyInviteLink}
                            className="shrink-0"
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </Button>
                    </div>
                </div>
            )}
        </section>
    );
}

PlayerTournamentShow.layout = (props: {
    tournament: { name: string; slug: string };
}) => ({
    breadcrumbs: [
        { title: 'Tournaments', href: index().url },
        {
            title: props.tournament.name,
            href: show(props.tournament.slug).url,
        },
    ],
});
