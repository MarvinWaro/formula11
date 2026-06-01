import { Head } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import DeleteHeiPopover from '@/components/delete-hei-popover';
import Heading from '@/components/heading';
import HeiFormModal from '@/components/hei-form-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/admin/heis';
import type { AdminPermissions, Hei } from '@/types';

type Props = {
    heis: Hei[];
    permissions: AdminPermissions;
};

export default function HeisIndex({ heis, permissions }: Props) {
    return (
        <>
            <Head title="HEIs" />

            <h1 className="sr-only">Higher Education Institutions</h1>

            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="HEIs"
                        description="Manage the registry of higher education institutions."
                    />

                    {permissions.canCreate && (
                        <HeiFormModal mode="create">
                            <Button data-test="heis-add-button">
                                <Plus /> Add HEI
                            </Button>
                        </HeiFormModal>
                    )}
                </div>

                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Abbreviation</th>
                                <th className="px-4 py-3">Region</th>
                                <th className="px-4 py-3 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {heis.map((hei) => (
                                <tr
                                    key={hei.id}
                                    data-test="hei-row"
                                    className="hover:bg-muted/30"
                                >
                                    <td className="px-4 py-3 font-medium">
                                        {hei.name}
                                    </td>
                                    <td className="px-4 py-3">
                                        {hei.abbreviation ? (
                                            <Badge variant="secondary">
                                                {hei.abbreviation}
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">
                                                —
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {hei.region ?? '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            {permissions.canEdit && (
                                                <HeiFormModal
                                                    mode="edit"
                                                    hei={hei}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        aria-label="Edit HEI"
                                                        data-test="hei-edit-button"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </HeiFormModal>
                                            )}
                                            {permissions.canDelete && (
                                                <DeleteHeiPopover hei={hei}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        aria-label="Delete HEI"
                                                        data-test="hei-delete-button"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </DeleteHeiPopover>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {heis.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No HEIs yet.
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

HeisIndex.layout = {
    breadcrumbs: [
        {
            title: 'HEIs',
            href: index(),
        },
    ],
};
