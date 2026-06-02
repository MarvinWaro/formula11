import { Head } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import DeleteUserPopover from '@/components/delete-user-popover';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import UserFormModal from '@/components/user-form-modal';
import { index } from '@/routes/admin/users';
import type { AdminPermissions, AdminUser, RoleSummary } from '@/types';

type Props = {
    users: AdminUser[];
    availableRoles: RoleSummary[];
    permissions: AdminPermissions;
};

export default function UsersIndex({
    users,
    availableRoles,
    permissions,
}: Props) {
    return (
        <>
            <Head title="Users" />

            <h1 className="sr-only">Users</h1>

            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Users"
                        description="Manage user accounts and assign roles."
                    />

                    {permissions.canCreate && (
                        <UserFormModal
                            mode="create"
                            availableRoles={availableRoles}
                        >
                            <Button data-test="users-add-button">
                                <Plus /> Add user
                            </Button>
                        </UserFormModal>
                    )}
                </div>

                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Roles</th>
                                <th className="px-4 py-3 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    data-test="user-row"
                                    className="hover:bg-muted/30"
                                >
                                    <td className="px-4 py-3 font-medium">
                                        {user.name}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {user.email}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles.length === 0 ? (
                                                <span className="text-xs text-muted-foreground italic">
                                                    No roles
                                                </span>
                                            ) : (
                                                user.roles.map((role) => (
                                                    <Badge
                                                        key={role.name}
                                                        variant="secondary"
                                                    >
                                                        {role.label}
                                                    </Badge>
                                                ))
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            {permissions.canEdit && (
                                                <UserFormModal
                                                    mode="edit"
                                                    user={user}
                                                    availableRoles={
                                                        availableRoles
                                                    }
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        aria-label="Edit user"
                                                        data-test="user-edit-button"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </UserFormModal>
                                            )}
                                            {permissions.canDelete && (
                                                <DeleteUserPopover user={user}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        aria-label="Delete user"
                                                        data-test="user-delete-button"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </DeleteUserPopover>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {users.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No users yet.
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

UsersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Users',
            href: index(),
        },
    ],
};
