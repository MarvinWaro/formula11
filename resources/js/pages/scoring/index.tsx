import { Head, Link } from '@inertiajs/react';
import { ChevronRight, ClipboardList, Trophy } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { index as scoringIndex } from '@/routes/admin/scoring';
import type { ScoringIndexProps } from '@/types';

export default function ScoringIndex({ tournaments }: ScoringIndexProps) {
    return (
        <>
            <Head title="Scoring" />

            <div className="space-y-6 px-4 py-6">
                <Heading
                    title="Scoring"
                    description="Manage pools, matches, and standings for each tournament category."
                />

                {tournaments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted-foreground">
                        <ClipboardList className="mx-auto mb-3 h-8 w-8" />
                        No tournaments to score yet.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {tournaments.map((tournament) => (
                            <div
                                key={tournament.id}
                                className="overflow-hidden rounded-2xl border bg-card shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3 border-b bg-muted/40 p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                                            <Trophy className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <h2 className="font-semibold leading-tight">
                                                {tournament.name}
                                            </h2>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {tournament.categories_count}{' '}
                                                {tournament.categories_count ===
                                                1
                                                    ? 'category'
                                                    : 'categories'}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary">
                                        {tournament.status_label}
                                    </Badge>
                                </div>
                                <ul className="divide-y">
                                    {tournament.categories.length === 0 && (
                                        <li className="px-4 py-3 text-xs text-muted-foreground">
                                            No categories yet.
                                        </li>
                                    )}
                                    {tournament.categories.map((c) => (
                                        <li key={c.id}>
                                            <Link
                                                href={`/tournaments/${tournament.slug}/categories/${c.id}/scoring`}
                                                className="flex items-center justify-between gap-2 px-4 py-3 text-sm transition-colors hover:bg-muted/40"
                                            >
                                                <span className="font-medium">
                                                    {c.name}
                                                </span>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

ScoringIndex.layout = () => ({
    breadcrumbs: [{ title: 'Scoring', href: scoringIndex().url }],
});
