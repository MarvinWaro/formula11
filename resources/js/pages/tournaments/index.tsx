import { Head, Link } from '@inertiajs/react';
import { Eye, Pencil, Plus, Trash2, Trophy } from 'lucide-react';
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

                {/* Mobile: card list */}
                <div className="grid gap-3 sm:hidden">
                    {tournaments.map((tournament) => (
                        <div
                            key={tournament.id}
                            data-test="tournament-row"
                            className="rounded-xl border bg-card p-4 shadow-sm"
                        >
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <Link
                                    href={show(tournament.slug).url}
                                    className="flex items-start gap-3"
                                >
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                                        <Trophy className="h-5 w-5" />
                                    </span>
                                    <span>
                                        <span className="block font-semibold leading-tight">
                                            {tournament.name}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                            {tournament.creator ?? 'No creator'}
                                        </span>
                                    </span>
                                </Link>
                                <Badge
                                    variant={statusVariant(tournament.status)}
                                >
                                    {tournament.status_label}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between gap-2 border-t pt-3">
                                <span className="text-xs text-muted-foreground">
                                    {tournament.categories_count}{' '}
                                    {tournament.categories_count === 1
                                        ? 'category'
                                        : 'categories'}
                                </span>
                                <TournamentRowActions
                                    tournament={tournament}
                                    permissions={permissions}
                                />
                            </div>
                        </div>
                    ))}
                    {tournaments.length === 0 && (
                        <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
                            No tournaments yet.
                        </div>
                    )}
                </div>

                {/* Desktop: table */}
                <div className="hidden overflow-hidden rounded-lg border sm:block">
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
                                            <TournamentRowActions
                                                tournament={tournament}
                                                permissions={permissions}
                                            />
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

function TournamentRowActions({
    tournament,
    permissions,
}: {
    tournament: TournamentSummary;
    permissions: TournamentPermissions;
}) {
    return (
        <div className="flex items-center gap-1">
            <Button
                asChild
                variant="ghost"
                size="sm"
                aria-label="View tournament"
            >
                <Link href={show(tournament.slug).url}>
                    <Eye className="h-4 w-4" />
                </Link>
            </Button>
            {permissions.canEdit && (
                <TournamentFormModal mode="edit" tournament={tournament}>
                    <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Edit tournament"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </TournamentFormModal>
            )}
            {permissions.canDelete && (
                <DeleteTournamentPopover tournament={tournament}>
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
    );
}

TournamentsIndex.layout = () => ({
    breadcrumbs: [{ title: 'Tournaments', href: index().url }],
});
