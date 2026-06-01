import { Head, Link } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import DeleteTournamentPopover from '@/components/delete-tournament-popover';
import Heading from '@/components/heading';
import TournamentFormModal from '@/components/tournament-form-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { index, show } from '@/routes/admin/tournaments';
import type { TournamentPermissions, TournamentSummary } from '@/types';

type Props = {
    tournaments: TournamentSummary[];
    permissions: TournamentPermissions;
};

const statusVariant = (
    status: TournamentSummary['status'],
): 'default' | 'secondary' | 'outline' => {
    switch (status) {
        case 'in_progress':
            return 'default';
        case 'completed':
            return 'outline';
        default:
            return 'secondary';
    }
};

export default function TournamentsIndex({ tournaments, permissions }: Props) {
    return (
        <>
            <Head title="Tournaments" />

            <div className="px-4 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading
                        title="Tournaments"
                        description="Create and manage pickleball tournaments."
                    />

                    {permissions.canCreate && (
                        <TournamentFormModal mode="create">
                            <Button data-test="tournaments-add-button">
                                <Plus /> New tournament
                            </Button>
                        </TournamentFormModal>
                    )}
                </div>

                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Categories</th>
                                <th className="px-4 py-3">Created by</th>
                                <th className="px-4 py-3 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {tournaments.map((tournament) => (
                                <tr
                                    key={tournament.id}
                                    data-test="tournament-row"
                                    className="hover:bg-muted/30"
                                >
                                    <td className="px-4 py-3 font-medium">
                                        <Link
                                            href={show(tournament.slug).url}
                                            className="hover:underline"
                                        >
                                            {tournament.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            variant={statusVariant(
                                                tournament.status,
                                            )}
                                        >
                                            {tournament.status_label}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {tournament.categories_count}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {tournament.creator ?? '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            {permissions.canDelete && (
                                                <DeleteTournamentPopover
                                                    tournament={tournament}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        aria-label="Delete tournament"
                                                        data-test="tournament-delete-button"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </DeleteTournamentPopover>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {tournaments.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No tournaments yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

TournamentsIndex.layout = () => ({
    breadcrumbs: [{ title: 'Tournaments', href: index().url }],
});
