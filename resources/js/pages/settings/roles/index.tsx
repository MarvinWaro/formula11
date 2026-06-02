import { Head } from '@inertiajs/react';
import { Lock, Pencil, Plus, Shield, Trash2 } from 'lucide-react';
import DeleteRolePopover from '@/components/delete-role-popover';
import Heading from '@/components/heading';
import RoleFormModal from '@/components/role-form-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/admin/roles';
import type { AdminPermissions, AdminRole, PermissionGroup } from '@/types';

type Props = {
    roles: AdminRole[];
    permissionGroups: PermissionGroup[];
    permissions: AdminPermissions;
};

export default function RolesIndex({
    roles,
    permissionGroups,
    permissions,
}: Props) {
    return (
        <>
            <Head title="Roles & Permissions" />

            <h1 className="sr-only">Roles & Permissions</h1>

            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Roles & Permissions"
                        description="Manage access control across the system."
                    />

                    {permissions.canCreate && (
                        <RoleFormModal
                            mode="create"
                            permissionGroups={permissionGroups}
                        >
                            <Button data-test="roles-add-button">
                                <Plus /> Add role
                            </Button>
                        </RoleFormModal>
                    )}
                </div>

                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Permissions</th>
                                <th className="px-4 py-3">Users</th>
                                <th className="px-4 py-3 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {roles.map((role) => (
                                <tr
                                    key={role.id}
                                    data-test="role-row"
                                    className="hover:bg-muted/30"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {role.is_system ? (
                                                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                            ) : (
                                                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                                            )}
                                            <div>
                                                <div className="font-medium">
                                                    {role.label}
                                                </div>
                                                {role.description && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {role.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="secondary">
                                            {role.permissions_count} permission
                                            {role.permissions_count === 1
                                                ? ''
                                                : 's'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {role.users_count}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            {role.name === 'super_admin' ? (
                                                <Badge variant="outline">
                                                    System Locked
                                                </Badge>
                                            ) : (
                                                <>
                                                    {permissions.canEdit && (
                                                        <RoleFormModal
                                                            mode="edit"
                                                            role={role}
                                                            permissionGroups={
                                                                permissionGroups
                                                            }
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                aria-label="Edit role"
                                                                data-test="role-edit-button"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </RoleFormModal>
                                                    )}
                                                    {permissions.canDelete &&
                                                        !role.is_system && (
                                                            <DeleteRolePopover
                                                                role={role}
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    aria-label="Delete role"
                                                                    data-test="role-delete-button"
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </DeleteRolePopover>
                                                        )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {roles.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No roles yet.
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

RolesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Roles & Permissions',
            href: index(),
        },
    ],
};
