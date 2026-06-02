import { Head, Link, router } from '@inertiajs/react';
import {
    AlarmClock,
    Building2,
    Calendar,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    Loader2,
    MapPin,
    Pencil,
    Phone,
    Plus,
    Share2,
    Sparkles,
    Trash2,
    Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import TournamentController from '@/actions/App/Http/Controllers/Admin/TournamentController';
import CategoryFormModal from '@/components/category-form-modal';
import DeleteCategoryPopover from '@/components/delete-category-popover';
import Heading from '@/components/heading';
import TournamentFormModal from '@/components/tournament-form-modal';
import TournamentShareDialog from '@/components/tournament-share-dialog';
import VenueMapPreview from '@/components/venue-map-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPeso as formatFee } from '@/lib/money';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { index } from '@/routes/admin/tournaments';
import type {
    CategoryPermissions,
    SelectOption,
    TournamentCategory,
    TournamentDetail,
    TournamentPermissions,
} from '@/types';

type Props = {
    tournament: TournamentDetail;
    divisionOptions: SelectOption[];
    skillLevelOptions: SelectOption[];
    formatOptions: SelectOption[];
    statusOptions: SelectOption[];
    permissions: TournamentPermissions & CategoryPermissions;
};

const categoryScoring = (category: TournamentCategory): string => {
    if (category.format === 'round_robin') {
        return `RR to ${category.rr_points_to_win}`;
    }

    if (category.format === 'single_elimination') {
        return `Elim to ${category.elim_points_to_win}`;
    }

    return `RR to ${category.rr_points_to_win} · Elim to ${category.elim_points_to_win}`;
};

const formatDate = (iso: string | null): string | null => {
    if (!iso) return null;
    const date = new Date(iso.replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

export default function TournamentShow({
    tournament,
    divisionOptions,
    skillLevelOptions,
    formatOptions,
    statusOptions,
    permissions,
}: Props) {
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const handleStatusChange = (next: string) => {
        if (next === tournament.status) {
            return;
        }

        const route = TournamentController.advanceStatus(tournament.slug);

        router.post(
            route.url,
            { status: next },
            {
                preserveScroll: true,
                onStart: () => setIsUpdatingStatus(true),
                onFinish: () => setIsUpdatingStatus(false),
                onError: (errors) => {
                    const message =
                        errors.status ?? 'Could not update tournament status.';
                    toast.error(message);
                },
            },
        );
    };

    const totalCategories = tournament.categories.length;
    const totalTeams = tournament.categories.reduce(
        (sum, c) => sum + (c.registered_teams_count ?? 0),
        0,
    );
    const startsAt = formatDate(tournament.starts_at);
    const endsAt = formatDate(tournament.ends_at);

    return (
        <>
            <Head title={tournament.name} />

            <div className="space-y-6 px-4 py-6">
                {/* HERO */}
                <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-sm">
                    <div className="flex flex-col gap-6 p-6 sm:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent">
                                    <Sparkles className="h-3 w-3" />
                                    {tournament.status_label}
                                </div>
                                <h1 className="text-2xl font-bold sm:text-3xl">
                                    {tournament.name}
                                </h1>
                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-primary-foreground/85">
                                    {tournament.organizer_name && (
                                        <span className="flex items-center gap-1.5">
                                            <Building2 className="h-4 w-4" />
                                            {tournament.organizer_name}
                                        </span>
                                    )}
                                    {tournament.venue && (
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4" />
                                            <span className="line-clamp-1">
                                                {tournament.venue}
                                            </span>
                                        </span>
                                    )}
                                    {(startsAt || endsAt) && (
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="h-4 w-4" />
                                            {startsAt}
                                            {endsAt && ` – ${endsAt}`}
                                        </span>
                                    )}
                                    {tournament.registration_deadline && (
                                        <span className="flex items-center gap-1.5">
                                            <AlarmClock className="h-4 w-4" />
                                            Register by{' '}
                                            {formatDate(
                                                tournament.registration_deadline,
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <TournamentShareDialog tournament={tournament}>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        data-test="share-tournament-button"
                                    >
                                        <Share2 className="h-4 w-4" /> Share
                                    </Button>
                                </TournamentShareDialog>
                                {permissions.canEdit && (
                                    <TournamentFormModal
                                        mode="edit"
                                        tournament={tournament}
                                    >
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                        >
                                            <Pencil className="h-4 w-4" /> Edit
                                        </Button>
                                    </TournamentFormModal>
                                )}
                                {permissions.canManage && (
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={tournament.status}
                                            onValueChange={handleStatusChange}
                                            disabled={isUpdatingStatus}
                                        >
                                            <SelectTrigger
                                                size="sm"
                                                className="w-44 bg-background/95 text-foreground"
                                                aria-label="Tournament status"
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent align="end">
                                                {statusOptions.map((option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {isUpdatingStatus && (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 sm:max-w-md">
                            <StatTile
                                label="Categories"
                                value={totalCategories.toString()}
                            />
                            <StatTile
                                label="Registered"
                                value={`${totalTeams}`}
                                sublabel={
                                    totalTeams === 1 ? 'team' : 'teams'
                                }
                            />
                            <StatTile
                                label="Default fee"
                                value={formatFee(tournament.registration_fee)}
                            />
                        </div>
                    </div>
                </section>

                {/* ABOUT + MAP */}
                {(tournament.description ||
                    (tournament.venue_lat !== null &&
                        tournament.venue_lng !== null)) && (
                    <section className="grid gap-4 lg:grid-cols-12">
                        {tournament.description && (
                            <DescriptionCard
                                description={tournament.description}
                                fee={tournament.registration_fee}
                            />
                        )}
                        {tournament.venue_lat !== null &&
                            tournament.venue_lng !== null && (
                                <div className="flex min-h-[22rem] flex-col overflow-hidden rounded-2xl border bg-card shadow-sm lg:col-span-4">
                                    <div className="flex items-center justify-between border-b px-5 py-3">
                                        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                            Venue
                                        </h2>
                                        <a
                                            href={`https://www.openstreetmap.org/?mlat=${tournament.venue_lat}&mlon=${tournament.venue_lng}#map=18/${tournament.venue_lat}/${tournament.venue_lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-medium text-primary hover:underline"
                                        >
                                            Open in maps
                                        </a>
                                    </div>
                                    <VenueMapPreview
                                        lat={tournament.venue_lat}
                                        lng={tournament.venue_lng}
                                        className="min-h-72 w-full flex-1"
                                    />
                                </div>
                            )}
                    </section>
                )}

                {/* CATEGORIES */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Heading
                            variant="small"
                            title="Categories"
                            description="Define divisions and scoring rules."
                        />
                        {permissions.canCreateCategory && (
                            <CategoryFormModal
                                mode="create"
                                tournament={tournament}
                                divisionOptions={divisionOptions}
                                skillLevelOptions={skillLevelOptions}
                                formatOptions={formatOptions}
                            >
                                <Button
                                    size="sm"
                                    data-test="category-add-button"
                                >
                                    <Plus className="h-4 w-4" /> Add category
                                </Button>
                            </CategoryFormModal>
                        )}
                    </div>

                    {tournament.categories.length === 0 ? (
                        <div className="rounded-2xl border border-dashed bg-card/50 p-8 text-center text-sm text-muted-foreground">
                            No categories yet. Add one to open registration.
                        </div>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {tournament.categories.map((c) => (
                                <CategoryCard
                                    key={c.id}
                                    category={c}
                                    tournament={tournament}
                                    permissions={permissions}
                                    divisionOptions={divisionOptions}
                                    skillLevelOptions={skillLevelOptions}
                                    formatOptions={formatOptions}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* REGISTERED TEAMS */}
                {tournament.categories.some(
                    (c) => (c.teams?.length ?? 0) > 0,
                ) && (
                    <section className="space-y-4">
                        <Heading
                            variant="small"
                            title="Registered teams"
                            description="Teams that have completed registration."
                        />
                        <div className="space-y-4">
                            {tournament.categories
                                .filter((c) => (c.teams?.length ?? 0) > 0)
                                .map((c) => (
                                    <RegisteredTeamsBlock
                                        key={c.id}
                                        category={c}
                                    />
                                ))}
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}

function DescriptionCard({
    description,
    fee,
}: {
    description: string;
    fee: number | null;
}) {
    const [expanded, setExpanded] = useState(false);
    const [overflowing, setOverflowing] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        // scrollHeight bigger than clientHeight means line-clamp is hiding content.
        setOverflowing(ref.current.scrollHeight - ref.current.clientHeight > 4);
    }, [description, expanded]);

    return (
        <div className="flex min-h-[22rem] flex-col rounded-2xl border bg-card p-5 shadow-sm lg:col-span-8">
            <h2 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                About this tournament
            </h2>
            <div
                ref={ref}
                className={cn(
                    'prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2',
                    !expanded && 'line-clamp-[14]',
                )}
                dangerouslySetInnerHTML={{ __html: description }}
            />
            {(overflowing || expanded) && (
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
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
            {fee !== null && fee > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                    <span className="font-semibold">₱</span>
                    Registration fee: {formatFee(fee)} per team
                </div>
            )}
        </div>
    );
}

function StatTile({
    label,
    value,
    sublabel,
}: {
    label: string;
    value: string;
    sublabel?: string;
}) {
    return (
        <div className="rounded-xl bg-primary-foreground/10 p-3 backdrop-blur">
            <div className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wide">
                {label}
            </div>
            <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-bold">{value}</span>
                {sublabel && (
                    <span className="text-xs text-primary-foreground/70">
                        {sublabel}
                    </span>
                )}
            </div>
        </div>
    );
}

function CategoryCard({
    category,
    tournament,
    permissions,
    divisionOptions,
    skillLevelOptions,
    formatOptions,
}: {
    category: TournamentCategory;
    tournament: TournamentDetail;
    permissions: TournamentPermissions & CategoryPermissions;
    divisionOptions: SelectOption[];
    skillLevelOptions: SelectOption[];
    formatOptions: SelectOption[];
}) {
    const cap = category.max_teams;
    const registered = category.registered_teams_count ?? 0;
    const isFull = cap !== null && registered >= cap;

    const effectiveFee =
        category.registration_fee ?? tournament.registration_fee;

    return (
        <div
            data-test="category-row"
            className="group flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                    <h3 className="font-semibold leading-tight">
                        {category.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        <Badge variant="secondary" className="text-xs">
                            {category.division_label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                            {category.skill_level_label}
                        </Badge>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {permissions.canEditCategory && (
                        <CategoryFormModal
                            mode="edit"
                            tournament={tournament}
                            category={category}
                            divisionOptions={divisionOptions}
                            skillLevelOptions={skillLevelOptions}
                            formatOptions={formatOptions}
                        >
                            <Button
                                variant="ghost"
                                size="sm"
                                aria-label="Edit category"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </CategoryFormModal>
                    )}
                    {permissions.canDeleteCategory && (
                        <DeleteCategoryPopover
                            tournament={tournament}
                            category={category}
                        >
                            <Button
                                variant="ghost"
                                size="sm"
                                aria-label="Delete category"
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </DeleteCategoryPopover>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
                <CategoryStat
                    label="Format"
                    value={category.format_label}
                />
                <CategoryStat
                    label="Scoring"
                    value={categoryScoring(category)}
                />
                <CategoryStat label="Fee" value={formatFee(effectiveFee)} />
                <CategoryStat
                    label="Capacity"
                    value={`${registered}${cap !== null ? `/${cap}` : ''} teams`}
                    accent={isFull ? 'destructive' : undefined}
                />
            </div>

            {cap !== null && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full bg-primary transition-all"
                        style={{
                            width: `${Math.min(100, (registered / cap) * 100)}%`,
                        }}
                    />
                </div>
            )}

            <Link
                href={`/tournaments/${tournament.slug}/categories/${category.id}/scoring`}
                className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
                <ClipboardList className="h-3.5 w-3.5" />
                Manage scoring
            </Link>
        </div>
    );
}

function CategoryStat({
    label,
    value,
    accent,
}: {
    label: string;
    value: string;
    accent?: 'destructive';
}) {
    return (
        <div>
            <div className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </div>
            <div
                className={
                    accent === 'destructive'
                        ? 'mt-0.5 text-sm font-medium text-destructive'
                        : 'mt-0.5 text-sm font-medium text-foreground'
                }
            >
                {value}
            </div>
        </div>
    );
}

function RegisteredTeamsBlock({ category }: { category: TournamentCategory }) {
    const teams = category.teams ?? [];

    return (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between bg-muted/50 px-4 py-2">
                <span className="text-sm font-semibold">{category.name}</span>
                <Badge variant="secondary">
                    {teams.length}
                    {category.max_teams !== null
                        ? `/${category.max_teams}`
                        : ''}{' '}
                    teams
                </Badge>
            </div>

            {/* Mobile: card list */}
            <div className="divide-y sm:hidden">
                {teams.map((team, i) => (
                    <div key={team.id} className="p-4">
                        <div className="mb-1 flex items-start justify-between gap-2">
                            <span className="font-medium">
                                {i + 1}. {team.display_name}
                            </span>
                            {team.hei_abbreviation && (
                                <Badge variant="outline" className="text-xs">
                                    {team.hei_abbreviation}
                                </Badge>
                            )}
                        </div>
                        <div className="space-y-0.5 text-xs text-muted-foreground">
                            {team.players.map((p, j) => (
                                <div
                                    key={j}
                                    className="flex items-center gap-1.5"
                                >
                                    <Users className="h-3 w-3" />
                                    <span>{p.display_name}</span>
                                    <span>
                                        ({p.is_captain ? 'P1' : 'P2'})
                                    </span>
                                </div>
                            ))}
                            {team.captain_phone && (
                                <div className="flex items-center gap-1.5 pt-1">
                                    <Phone className="h-3 w-3" />
                                    {team.captain_phone}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop: table */}
            <table className="hidden w-full text-sm sm:table">
                <thead className="text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    <tr>
                        <th className="px-4 py-2">#</th>
                        <th className="px-4 py-2">Team</th>
                        <th className="px-4 py-2">Players</th>
                        <th className="px-4 py-2">Affiliation</th>
                        <th className="px-4 py-2">Contact</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {teams.map((team, i) => (
                        <tr key={team.id} className="hover:bg-muted/30">
                            <td className="px-4 py-3 text-muted-foreground">
                                {i + 1}
                            </td>
                            <td className="px-4 py-3 font-medium">
                                {team.display_name}
                            </td>
                            <td className="px-4 py-3">
                                <div className="space-y-0.5">
                                    {team.players.map((p, j) => (
                                        <div
                                            key={j}
                                            className="flex items-center gap-1.5 text-xs"
                                        >
                                            <Users className="h-3 w-3 text-muted-foreground" />
                                            <span>{p.display_name}</span>
                                            <span className="text-muted-foreground">
                                                ({p.is_captain ? 'P1' : 'P2'})
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                                {team.hei_abbreviation ??
                                    team.hei_name ??
                                    '—'}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                                {team.captain_phone ? (
                                    <span className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {team.captain_phone}
                                    </span>
                                ) : (
                                    '—'
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

TournamentShow.layout = (props: { tournament: TournamentDetail }) => ({
    breadcrumbs: [
        { title: 'Tournaments', href: index().url },
        {
            title: props.tournament.name,
            href: `/tournaments/${props.tournament.slug}`,
        },
    ],
});
