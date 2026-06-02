import { Head, Link } from '@inertiajs/react';
import {
    AlarmClock,
    ArrowRight,
    Building2,
    Calendar,
    MapPin,
    Trophy,
} from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { formatPeso as formatFee } from '@/lib/money';
import { index, show } from '@/routes/player/tournaments';
import type {
    PlayerTournamentCategory,
    PlayerTournamentIndexProps,
    PlayerTournamentSummary,
} from '@/types';

const formatDate = (iso: string | null): string => {
    if (!iso) return 'TBA';
    const date = new Date(iso.replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
    });
};

const dateRange = (startsAt: string | null, endsAt: string | null): string => {
    if (!startsAt && !endsAt) return 'Dates TBA';
    if (startsAt && endsAt && startsAt === endsAt) return formatDate(startsAt);
    return `${formatDate(startsAt)} – ${formatDate(endsAt)}`;
};

const minFee = (categories: PlayerTournamentCategory[]): number | null => {
    const fees = categories
        .map((c) => c.registration_fee)
        .filter((f): f is number => f !== null);
    if (fees.length === 0) return null;
    return Math.min(...fees);
};

export default function PlayerTournamentsIndex({
    tournaments,
}: PlayerTournamentIndexProps) {
    return (
        <>
            <Head title="Tournaments" />

            <div className="space-y-5 px-4 py-5 sm:py-6">
                <Heading
                    title="Tournaments"
                    description="Browse open tournaments and register your doubles team."
                />

                {tournaments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
                        <Trophy className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            No tournaments are open for registration right now.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(20rem,1fr))]">
                        {tournaments.map((tournament) => (
                            <TournamentCard
                                key={tournament.id}
                                tournament={tournament}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function TournamentCard({ tournament }: { tournament: PlayerTournamentSummary }) {
    const openCount = tournament.categories.filter((c) => !c.is_full).length;
    const fee = minFee(tournament.categories);
    const deadline = tournament.registration_deadline
        ? new Date(tournament.registration_deadline)
        : null;
    const urgent =
        deadline !== null &&
        deadline.getTime() - Date.now() < 48 * 60 * 60 * 1000;

    return (
        <Link
            href={show(tournament.slug).url}
            data-test="player-tournament-card"
            className="group block"
        >
            <article className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-all group-hover:border-primary/30 group-hover:shadow-md">
                {/* Hero strip */}
                <div className="flex items-start gap-3 bg-gradient-to-br from-primary to-primary/85 p-4 text-primary-foreground sm:p-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                        <Trophy className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-accent uppercase">
                            Registration open
                        </div>
                        <h2 className="truncate text-base font-bold leading-tight sm:text-lg">
                            {tournament.name}
                        </h2>
                        {tournament.organizer_name && (
                            <p className="mt-0.5 truncate text-xs text-primary-foreground/80">
                                <Building2 className="mr-1 inline h-3 w-3" />
                                {tournament.organizer_name}
                            </p>
                        )}
                    </div>
                    <ArrowRight className="mt-2 h-5 w-5 shrink-0 text-primary-foreground/70 transition-transform group-hover:translate-x-0.5" />
                </div>

                {/* Stat strip */}
                <div className="grid grid-cols-3 divide-x border-b bg-muted/30 text-center text-xs">
                    <Stat
                        label="Categories"
                        value={openCount.toString()}
                        sub={openCount === 1 ? 'open' : 'open'}
                    />
                    <Stat
                        label="Starts"
                        value={formatDate(tournament.starts_at)}
                        sub={dateRange(
                            tournament.starts_at,
                            tournament.ends_at,
                        )}
                    />
                    <Stat
                        label="Fee from"
                        value={fee === null ? 'Free' : formatFee(fee)}
                    />
                </div>

                {/* Meta */}
                <div className="space-y-2 px-4 py-3 text-xs text-muted-foreground sm:px-5">
                    {tournament.venue && (
                        <div className="flex items-start gap-1.5">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span className="line-clamp-2">
                                {tournament.venue}
                            </span>
                        </div>
                    )}
                    {deadline && (
                        <div
                            className={
                                urgent
                                    ? 'flex items-center gap-1.5 font-medium text-destructive'
                                    : 'flex items-center gap-1.5'
                            }
                        >
                            <AlarmClock className="h-3.5 w-3.5 shrink-0" />
                            Register by{' '}
                            {deadline.toLocaleDateString('en-PH', {
                                month: 'short',
                                day: 'numeric',
                            })}
                            ,{' '}
                            {deadline.toLocaleTimeString('en-PH', {
                                hour: 'numeric',
                                minute: '2-digit',
                            })}
                        </div>
                    )}
                    {!tournament.venue && !deadline && (
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {dateRange(
                                tournament.starts_at,
                                tournament.ends_at,
                            )}
                        </div>
                    )}
                </div>

                {/* Category chips */}
                {tournament.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 border-t bg-card px-4 pt-3 pb-4 sm:px-5">
                        {tournament.categories.slice(0, 4).map((c) => (
                            <Badge
                                key={c.id}
                                variant={c.is_full ? 'outline' : 'secondary'}
                                className="text-[11px]"
                            >
                                {c.name}
                                {c.is_full && ' • Full'}
                            </Badge>
                        ))}
                        {tournament.categories.length > 4 && (
                            <Badge variant="outline" className="text-[11px]">
                                +{tournament.categories.length - 4}
                            </Badge>
                        )}
                    </div>
                )}
            </article>
        </Link>
    );
}

function Stat({
    label,
    value,
    sub,
}: {
    label: string;
    value: string;
    sub?: string;
}) {
    return (
        <div className="px-2 py-3">
            <div className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </div>
            <div className="mt-0.5 text-sm font-bold text-foreground">
                {value}
            </div>
            {sub && (
                <div className="text-[10px] text-muted-foreground">{sub}</div>
            )}
        </div>
    );
}

PlayerTournamentsIndex.layout = () => ({
    breadcrumbs: [{ title: 'Tournaments', href: index().url }],
});
