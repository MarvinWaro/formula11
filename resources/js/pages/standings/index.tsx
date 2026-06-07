import { Head, Link } from '@inertiajs/react';
import { ChevronRight, Trophy } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { show as standingsShow } from '@/routes/standings';

type Category = {
    id: string;
    name: string;
    slug: string;
    division_label: string;
    skill_level_label: string;
    format_label: string;
    rules_label: string;
};

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

type Props = {
    tournament: Tournament;
    categories: Category[];
};

export default function StandingsIndex({ tournament, categories }: Props) {
    return (
        <>
            <Head title={`Standings · ${tournament.name}`} />

            <div className="space-y-5 px-4 py-5 sm:px-6">
                <Heading
                    title={tournament.name}
                    description={
                        tournament.organizer_name
                            ? `Standings & bracket — hosted by ${tournament.organizer_name}.`
                            : 'Standings & bracket overview.'
                    }
                />

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{tournament.status_label}</Badge>
                    {tournament.venue && <span>{tournament.venue}</span>}
                </div>

                {categories.length === 0 ? (
                    <div className="rounded-2xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted-foreground">
                        <Trophy className="mx-auto mb-3 h-8 w-8" />
                        No categories yet.
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {categories.map((c) => (
                            <Link
                                key={c.id}
                                href={
                                    standingsShow([tournament.slug, c.slug]).url
                                }
                                className="group rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 space-y-1">
                                        <h2 className="truncate text-sm font-semibold">
                                            {c.name}
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            {c.division_label} ·{' '}
                                            {c.skill_level_label}
                                        </p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                                </div>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    <Badge
                                        variant="outline"
                                        className="text-[10px]"
                                    >
                                        {c.format_label}
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className="text-[10px]"
                                    >
                                        {c.rules_label}
                                    </Badge>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
