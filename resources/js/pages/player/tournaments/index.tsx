import { Head, Link } from '@inertiajs/react';
import { Building2, Calendar, MapPin, Trophy } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPeso as formatFee } from '@/lib/money';
import { index, show } from '@/routes/player/tournaments';
import type {
    PlayerTournamentCategory,
    PlayerTournamentIndexProps,
} from '@/types';

const dateRange = (startsAt: string | null, endsAt: string | null): string => {
    if (startsAt && endsAt) {
        return `${startsAt} - ${endsAt}`;
    }

    return startsAt ?? endsAt ?? 'Dates TBA';
};

const categorySummary = (category: PlayerTournamentCategory): string =>
    `${category.division_label} - ${category.skill_level_label} - ${category.format_label}`;

export default function PlayerTournamentsIndex({
    tournaments,
}: PlayerTournamentIndexProps) {
    return (
        <>
            <Head title="Tournaments" />

            <div className="space-y-6 px-4 py-6">
                <Heading
                    title="Tournaments"
                    description="Browse open pickleball tournaments and register your doubles team."
                />

                <div className="grid gap-4 lg:grid-cols-2">
                    {tournaments.map((tournament) => (
                        <article
                            key={tournament.id}
                            className="rounded-lg border bg-background p-5"
                            data-test="player-tournament-card"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Trophy className="h-4 w-4" />
                                        Registration open
                                    </div>
                                    <h2 className="text-lg font-semibold">
                                        {tournament.name}
                                    </h2>
                                </div>
                                <Button asChild size="sm">
                                    <Link href={show(tournament.slug).url}>
                                        View
                                    </Link>
                                </Button>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                {tournament.organizer_name && (
                                    <span className="flex items-center gap-1">
                                        <Building2 className="h-4 w-4" />
                                        {tournament.organizer_name}
                                    </span>
                                )}
                                {tournament.venue && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {tournament.venue}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {dateRange(
                                        tournament.starts_at,
                                        tournament.ends_at,
                                    )}
                                </span>
                            </div>

                            <div className="mt-4 space-y-2">
                                {tournament.categories.map((category) => (
                                    <div
                                        key={category.id}
                                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                                    >
                                        <div>
                                            <div className="font-medium">
                                                {category.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {categorySummary(category)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">
                                                {formatFee(
                                                    category.registration_fee,
                                                )}
                                            </div>
                                            <Badge
                                                variant={
                                                    category.is_full
                                                        ? 'outline'
                                                        : 'secondary'
                                                }
                                            >
                                                {category.is_full
                                                    ? 'Full'
                                                    : `${category.registered_teams}${category.max_teams !== null ? `/${category.max_teams}` : ''} teams`}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </article>
                    ))}

                    {tournaments.length === 0 && (
                        <div className="rounded-lg border bg-background p-8 text-center text-muted-foreground lg:col-span-2">
                            No tournaments are open for registration right now.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

PlayerTournamentsIndex.layout = () => ({
    breadcrumbs: [{ title: 'Tournaments', href: index().url }],
});
