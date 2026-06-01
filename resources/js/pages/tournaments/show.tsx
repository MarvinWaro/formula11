import { Form, Head } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    Calendar,
    MapPin,
    Pencil,
    Plus,
    Share2,
    Trash2,
} from 'lucide-react';
import TournamentController from '@/actions/App/Http/Controllers/Admin/TournamentController';
import CategoryFormModal from '@/components/category-form-modal';
import DeleteCategoryPopover from '@/components/delete-category-popover';
import Heading from '@/components/heading';
import TournamentFormModal from '@/components/tournament-form-modal';
import TournamentShareDialog from '@/components/tournament-share-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/admin/tournaments';
import type {
    CategoryPermissions,
    SelectOption,
    TournamentDetail,
    TournamentPermissions,
    TournamentStatus,
} from '@/types';

type Props = {
    tournament: TournamentDetail;
    divisionOptions: SelectOption[];
    skillLevelOptions: SelectOption[];
    permissions: TournamentPermissions & CategoryPermissions;
};

const NEXT_STATUS: Record<TournamentStatus, TournamentStatus | null> = {
    draft: 'registration_open',
    registration_open: 'registration_closed',
    registration_closed: 'in_progress',
    in_progress: 'completed',
    completed: null,
};

const NEXT_STATUS_LABEL: Record<TournamentStatus, string> = {
    draft: 'Open registration',
    registration_open: 'Close registration',
    registration_closed: 'Start tournament',
    in_progress: 'Mark completed',
    completed: 'Completed',
};

export default function TournamentShow({
    tournament,
    divisionOptions,
    skillLevelOptions,
    permissions,
}: Props) {
    const nextStatus = NEXT_STATUS[tournament.status];

    return (
        <>
            <Head title={tournament.name} />

            <div className="space-y-6 px-4 py-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="mb-2 flex items-center gap-3">
                            <Heading title={tournament.name} />
                            <Badge variant="secondary">
                                {tournament.status_label}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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
                            {(tournament.starts_at || tournament.ends_at) && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {tournament.starts_at}
                                    {tournament.ends_at &&
                                        ` – ${tournament.ends_at}`}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <TournamentShareDialog tournament={tournament}>
                            <Button
                                variant="outline"
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
                                <Button variant="outline" size="sm">
                                    <Pencil className="h-4 w-4" /> Edit
                                </Button>
                            </TournamentFormModal>
                        )}
                        {permissions.canManage && nextStatus && (
                            <Form
                                {...TournamentController.advanceStatus.form(
                                    tournament.slug,
                                )}
                                transform={(data) => ({
                                    ...data,
                                    status: nextStatus,
                                })}
                            >
                                {({ processing }) => (
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={processing}
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                        {NEXT_STATUS_LABEL[tournament.status]}
                                    </Button>
                                )}
                            </Form>
                        )}
                    </div>
                </div>

                <div className="flex flex-col space-y-4">
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

                    <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Division</th>
                                    <th className="px-4 py-3">Skill</th>
                                    <th className="px-4 py-3">RR / Elim</th>
                                    <th className="px-4 py-3">Bracket</th>
                                    <th className="px-4 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {tournament.categories.map((c) => (
                                    <tr
                                        key={c.id}
                                        data-test="category-row"
                                        className="hover:bg-muted/30"
                                    >
                                        <td className="px-4 py-3 font-medium">
                                            {c.name}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="secondary">
                                                {c.division_label}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {c.skill_level_label}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {c.rr_points_to_win} /{' '}
                                            {c.elim_points_to_win}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {c.bracket_size} teams,{' '}
                                            {c.teams_advancing_per_bracket}{' '}
                                            advance
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                {permissions.canEditCategory && (
                                                    <CategoryFormModal
                                                        mode="edit"
                                                        tournament={tournament}
                                                        category={c}
                                                        divisionOptions={
                                                            divisionOptions
                                                        }
                                                        skillLevelOptions={
                                                            skillLevelOptions
                                                        }
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
                                                        category={c}
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
                                        </td>
                                    </tr>
                                ))}
                                {tournament.categories.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            No categories yet. Add one to open
                                            registration.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
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
